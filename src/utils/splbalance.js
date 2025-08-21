import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';

async function getSplTokenBalance(
  walletAddress,
  tokenMintAddress,
  rpcUrl = 'https://api.devnet.solana.com',
) {
  try {
    // Create connection to Solana
    const connection = new Connection(rpcUrl, 'confirmed');

    // Convert strings to PublicKey objects
    const walletPublicKey = new PublicKey(walletAddress);
    const tokenMintPublicKey = new PublicKey(tokenMintAddress);

    // Get the associated token account address
    const associatedTokenAddress = await getAssociatedTokenAddress(
      tokenMintPublicKey,
      walletPublicKey,
    );

    console.log(`Associated Token Account: ${associatedTokenAddress.toString()}`);

    // Check if the associated token account exists first
    const accountInfo = await connection.getAccountInfo(associatedTokenAddress);

    if (!accountInfo) {
      console.log('Associated Token Account does not exist yet');
      return {
        balance: 0,
        decimals: 0,
        uiAmount: 0,
        tokenAccount: associatedTokenAddress.toString(),
        error: 'Associated Token Account not created yet (balance is 0)',
      };
    }

    // Get token account info
    const tokenAccount = await getAccount(connection, associatedTokenAddress);

    // Get mint info to get decimals
    const mintInfo = await connection.getParsedAccountInfo(tokenMintPublicKey);
    const decimals = mintInfo.value?.data?.parsed?.info?.decimals || 0;

    // Calculate UI amount (human readable)
    const balance = Number(tokenAccount.amount);
    const uiAmount = balance / Math.pow(10, decimals);

    return {
      balance: balance, // Raw balance
      decimals: decimals,
      uiAmount: uiAmount, // Human readable balance
      tokenAccount: associatedTokenAddress.toString(),
    };
  } catch (error) {
    console.log('Detailed error:', error);

    if (
      error.message.includes('could not find account') ||
      error.message.includes('Invalid account owner') ||
      error.name === 'TokenAccountNotFoundError'
    ) {
      return {
        balance: 0,
        decimals: 0,
        uiAmount: 0,
        tokenAccount: null,
        error: 'Token account not found (balance is 0)',
      };
    }
    throw new Error(`Failed to fetch token balance: ${error.message}`);
  }
}

export async function getBalanceoftreasury() {
  try {
    const walletAddress = 'DQrck3fr5Ta4a22DbPXMeWfqoCtmntHx2ky9M5BmbwGa';
    const usdcMint = 'pdnmN1LAcPjahDoz588sPPeBbeixVGWqib63V7bkcyb';

    console.log('Fetching USDC balance...');
    const balance = await getSplTokenBalance(walletAddress, usdcMint);
    console.log(balance);

    console.log('Token Balance Info:');
    console.log(`Raw Balance: ${balance.balance}`);
    console.log(`Decimals: ${balance.decimals}`);
    console.log(`UI Amount: ${balance.uiAmount}`);
    console.log(`Token Account: ${balance.tokenAccount}`);
    return balance?.uiAmount;
  } catch (error) {
    console.error('Error:', error.message);
  }
}
