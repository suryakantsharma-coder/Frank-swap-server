import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, transfer } from '@solana/spl-token';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata';

(async () => {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const data = await connection.getTransaction(
    '24Xw85ugJXjrYni4seSpXg2wAnoU5poGG9CcEpjWP2ELEY4Nt9mJcYHik7azoymHoATwqVtAe8nrFBRbb9UcXNQd',
  );

  console.log(JSON.stringify(data, null, 2));

  // Payer (dev keypair just for testing)
  // const mnemonic =
  //   '';
  // const seed = await bip39.mnemonicToSeed(mnemonic);
  // const path = "m/44'/501'/0'/0'";
  // const derivedSeed = derivePath(path, seed.toString('hex')).key;
  // const payer = Keypair.fromSeed(derivedSeed);

  // // await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
  // console.log(
  //   'Payer:',
  //   payer.publicKey.toBase58(),
  //   'Balance:',
  //   (await connection.getBalance(payer.publicKey)) / LAMPORTS_PER_SOL,
  //   'SOL',
  //   payer.secretKey.toString(),
  // );

  // // 1) Create a mint (decimals = 6, freezeAuthority = null)
  // const mint = await createMint(connection, payer, payer.publicKey, null, 6);

  // // 2) Get/create your ATA for that mint
  // const myAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);

  // // 3) Mint 1,000 tokens to your ATA (6 decimals -> base units)
  // await mintTo(
  //   connection,
  //   payer,
  //   mint,
  //   myAta.address,
  //   payer,
  //   1_000_000_000n, // 1000 * 10^6 as bigint
  // );

  // // 4) Transfer 25 tokens to someone else
  // const recipient = Keypair.generate().publicKey; // replace with their pubkey
  // const toAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, recipient);
  // await transfer(
  //   connection,
  //   payer,
  //   myAta.address,
  //   toAta.address,
  //   payer,
  //   25_000_000n, // 25 * 10^6
  // );

  // console.log('Mint:', mint.toBase58());
  // console.log('Your ATA:', myAta.address.toBase58());
  // console.log('Recipient ATA:', toAta.address.toBase58());
})();
