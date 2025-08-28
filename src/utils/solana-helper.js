import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
} from '@solana/spl-token';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import dotenv from 'dotenv';
import bs58 from 'bs58';
dotenv.config();

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

export function extractTransactionDetails(tx) {
  if (!tx?.meta?.preTokenBalances || !tx?.meta?.postTokenBalances) {
    throw new Error('Invalid transaction format');
  }

  const pre = tx.meta.preTokenBalances;
  const post = tx.meta.postTokenBalances;

  let from = null,
    to = null,
    amount = null;

  pre.forEach(preBal => {
    const postBal = post.find(p => p.accountIndex === preBal.accountIndex);

    if (!postBal) return;

    const preAmount = Number(preBal.uiTokenAmount.uiAmount);
    const postAmount = Number(postBal.uiTokenAmount.uiAmount);

    if (preAmount > postAmount) {
      from = preBal.owner;
      amount = preAmount - postAmount;
    } else if (postAmount > preAmount) {
      to = postBal.owner;
      amount = postAmount - preAmount;
    }
  });

  // check status
  let status = 'failed';
  if (tx?.meta?.err === null && tx?.meta?.status?.Ok !== undefined) {
    status = 'success';
  }

  return { from, to, amount, status };
}

export function parseTokenTransfer(tx) {
  try {
    const pre = tx.meta.preTokenBalances;
    const post = tx.meta.postTokenBalances;

    if (!pre || !post || pre.length === 0 || post.length === 0) {
      throw new Error('No token balance changes found.');
    }

    // Mint + decimals (same for all accounts in this transfer)
    const mint = post[0].mint;
    const decimals = post[0].uiTokenAmount.decimals;

    // Track changes
    const changes = [];
    for (let i = 0; i < pre.length; i++) {
      const preAmount = Number(pre[i].uiTokenAmount.uiAmount);
      const postAmount = Number(post[i].uiTokenAmount.uiAmount);
      const diff = postAmount - preAmount;

      if (diff !== 0) {
        changes.push({
          owner: pre[i].owner,
          change: diff,
        });
      }
    }

    const sender = changes.find(c => c.change < 0);
    const receiver = changes.find(c => c.change > 0);

    return {
      mint,
      decimals,
      sender: sender?.owner || null,
      receiver: receiver?.owner || null,
      amount: Math.abs(sender?.change || receiver?.change || 0),
    };
  } catch (err) {
    console.error('Error parsing transfer:', err.message);
    return null;
  }
}

export function parseTransfer(tx) {
  try {
    const { preTokenBalances, postTokenBalances, preBalances, postBalances } = tx.meta;
    const keys = tx.transaction.message.accountKeys;

    // ✅ Case 1: SPL token transfer
    if (preTokenBalances.length > 0 && postTokenBalances.length > 0) {
      const mint = postTokenBalances[0].mint;
      const decimals = postTokenBalances[0].uiTokenAmount.decimals;

      const changes = [];
      for (let i = 0; i < preTokenBalances.length; i++) {
        const preAmount = Number(preTokenBalances[i].uiTokenAmount.uiAmount);
        const postAmount = Number(postTokenBalances[i].uiTokenAmount.uiAmount);
        const diff = postAmount - preAmount;

        if (diff !== 0) {
          changes.push({ owner: preTokenBalances[i].owner, change: diff });
        }
      }

      const sender = changes.find(c => c.change < 0);
      const receiver = changes.find(c => c.change > 0);

      return {
        type: 'SPL',
        mint,
        decimals,
        sender: sender?.owner || null,
        receiver: receiver?.owner || null,
        amount: Math.abs(sender?.change || receiver?.change || 0),
      };
    }

    // ✅ Case 2: Native SOL transfer
    if (preBalances.length > 0 && postBalances.length > 0) {
      let sender = null,
        receiver = null,
        amount = 0;

      for (let i = 0; i < preBalances.length; i++) {
        const diff = postBalances[i] - preBalances[i];
        if (diff < 0) sender = { owner: keys[i], change: diff };
        if (diff > 0) receiver = { owner: keys[i], change: diff };
      }

      amount = Math.abs(receiver?.change || sender?.change || 0) / 1e9; // lamports → SOL

      if (amount > 0) {
        return {
          type: 'SOL',
          sender: sender?.owner,
          receiver: receiver?.owner,
          amount,
        };
      }
    }

    return null;
  } catch (err) {
    console.error('Error parsing transfer:', err.message);
    return null;
  }
}

const getTransuryWallet = async () => {
  const mnemonic = process.env.MNEMONIC;
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const path = "m/44'/501'/0'/0'";
  const derivedSeed = derivePath(path, seed.toString('hex')).key;
  const treasury = Keypair.fromSeed(derivedSeed);
  return { treasury, mint: new PublicKey(process.env.MINT_ADDRESS) };
};

const getTransuryWalletByKey = async () => {
  const secretKey = bs58.decode(process.env.PRIVATE_KEY);
  const treasury = Keypair.fromSecretKey(secretKey);
  const publicKey = treasury.publicKey.toBase58();
  return { treasury, mint: new PublicKey(process.env.MINT_ADDRESS) };
};

export async function sendTokenToUser(toAddress, amount) {
  try {
    console.log('Received request to send token:', { toAddress, amount });
    const { treasury, mint } = await getTransuryWalletByKey();
    if (!toAddress || !amount) {
      return res.status(400).json({ error: 'toAddress and amount required' });
    }
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    const user = new PublicKey(toAddress);

    // Get or create ATA for treasury and user
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      treasury,
      mint,
      treasury.publicKey,
    );
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      treasury,
      mint,
      user,
    );

    // Create transfer instruction
    const tx = new Transaction().add(
      createTransferInstruction(
        fromTokenAccount.address,
        toTokenAccount.address,
        treasury.publicKey,
        amount,
      ),
    );

    // Send transaction
    const signature = await sendAndConfirmTransaction(connection, tx, [treasury]);
    return { success: true, txSignature: signature };
  } catch (err) {
    return { error: err.message, status: 500 };
  }
}

export async function getTokenBalance(mintAddress) {
  try {
    const { treasury, mint } = await getTransuryWalletByKey();
    const walletPubkey = new PublicKey(treasury);
    const mintPubkey = new PublicKey(mint);
    console.log({ walletPubkey, mintPubkey });

    // // Get Associated Token Account (ATA)
    // const ata = await getAssociatedTokenAddress(mintPubkey, treasury);

    // // Fetch account info
    // const accountInfo = await getAccount(connection, ata);

    // // Balance = raw amount / (10^decimals)
    // const decimals = accountInfo.amount.decimalPlaces ?? 0; // safer handling
    // const balance = Number(accountInfo.amount) / Math.pow(10, accountInfo.decimals);

    // console.log({ mintAddress, balance, decimals, accountInfo });

    // return balance;

    // Fetch all token accounts for this wallet + mint
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubkey, {
      mint: mintPubkey,
    });

    console.log({ tokenAccounts });

    if (tokenAccounts.value.length === 0) {
      // Wallet has no token account for this mint
      return 0;
    }

    const accountInfo = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;

    // Convert bigint string into number with decimals
    const balance = Number(accountInfo.amount) / Math.pow(10, accountInfo.decimals);
    return balance;
  } catch (err) {
    console.error('Error fetching token balance:', err.message);
    return 0;
  }
}
