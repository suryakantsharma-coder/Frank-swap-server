import { Connection, Transaction, SystemProgram, PublicKey, Keypair } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from '@solana/spl-token';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';

const connection = new Connection('https://api.devnet.solana.com');

export async function prepareClaimTx(userPubkey, amount) {
  const mnemonic =
    'coin novel music accident there circle clay easily define script need orange husband sheriff predict tooth stand yard basic vital human crew rifle scene';
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const path = "m/44'/501'/0'/0'";
  const derivedSeed = derivePath(path, seed.toString('hex')).key;
  const treasury = Keypair.fromSeed(derivedSeed);

  const mint = new PublicKey('pdnmN1LAcPjahDoz588sPPeBbeixVGWqib63V7bkcyb');
  const user = new PublicKey(userPubkey);

  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    treasury,
    mint,
    treasury.publicKey,
  );

  const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, treasury, mint, user);

  const tx = new Transaction().add(
    createTransferInstruction(
      fromTokenAccount.address,
      toTokenAccount.address,
      treasury.publicKey, // authority
      amount,
    ),
  );

  tx.feePayer = user;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  // ❌ DON'T DO THIS: tx.partialSign(treasury);
  // Let the user's wallet handle ALL signing

  tx.sign(treasury);

  const serialized = tx
    .serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    })
    .toString('base64');

  return serialized;
}

prepareClaimTx('9L6FimdSBGQ2DfvxcVpZsdZ2m2ZRSZvcmb7U31HjeDn9', 1000000)
  .then(serialized => {
    console.log('Serialized transaction:', serialized);
  })
  .catch(err => {
    console.error('Error preparing transaction:', err);
  });
