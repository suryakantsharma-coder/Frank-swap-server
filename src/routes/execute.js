import { clusterApiUrl, Connection } from '@solana/web3.js';
import { Router } from 'express';
import {
  extractTransactionDetails,
  parseTokenTransfer,
  parseTransfer,
  sendTokenToUser,
} from '../utils/solana-helper.js';
import { getTransaction, storeTransaction } from '../utils/file.js';
import { transfer } from '@solana/spl-token';
import { fetchJupiterPrices } from '../data/price.js';
import { getCurrentValue } from '../utils/dailyUpdate.js';

export const execute = Router();

const calculateTokenToBeSend = async (amount, mint) => {
  if (amount && mint) {
    const price = await fetchJupiterPrices([mint]);
    const tokenPrice = price.data[mint];
    const usdAmount = parseFloat(tokenPrice?.usdPrice || '0') * parseFloat(amount || '0');
    const frankAmount = usdAmount * getCurrentValue();
    const convertIndecimal = frankAmount.toFixed(2) * 10 ** 6;
    console.log({ convertIndecimal, usdAmount, frankAmount, tokenPrice, amount, price });
    return convertIndecimal;
  }
};

execute.post('/execute-Transaction', async (req, res) => {
  try {
    const { txSignature, mint } = req.body;
    console.log('Health check request received:', req.body, txSignature);

    if (txSignature) {
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      const preSignature = getTransaction(txSignature);
      console.log('Checking pre-existing transaction signature:', preSignature);
      if (preSignature?.status === 'found') {
        console.log(`Transaction signature already processed: ${txSignature}`);
        // return res.json({
        //   status: 'OK',
        //   message: 'Transaction signature already processed',
        //   txSignature,
        // });
        throw new Error('Transaction signature already processed');
      }
      console.log(`Checking transaction signature: ${txSignature}`);
      const details = await connection.getTransaction(txSignature);
      const txData = extractTransactionDetails(details);
      const { amount: value, sender } = parseTransfer(details);
      const toAmount = await calculateTokenToBeSend(value, mint);
      console.log('Transaction data:', toAmount);
      if (txData && toAmount) {
        console.log('Transaction details:', txData);
        const { from } = txData;
        const signature = await sendTokenToUser(from || sender, toAmount);
        console.log('Sending token to user:', signature);
        const txn = {
          ...txData,
          swap: signature,
          timestamp: new Date().toISOString(),
          transferSignature: txSignature || 'N/A',
        };
        storeTransaction(txSignature, txn);
        if (signature) {
          return res.json({
            status: 'OK',
            message: 'Transaction verified and token sent successfully',
            txSignature: signature,
          });
        }
      }
      throw new Error('Transaction data invlaid');
    }
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});
