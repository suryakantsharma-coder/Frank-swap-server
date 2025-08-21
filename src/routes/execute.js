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
import { getCurrentValue } from '../utils/dailyUpdateV2.js';
import { amount } from '@metaplex-foundation/js';
import { setIncrementTokenCount, setValue } from '../utils/sellTokens.js';

export const execute = Router();

const calculateTokenToBeSend = async (amount, mint) => {
  if (amount && mint) {
    const price = await fetchJupiterPrices([mint]);
    const tokenPrice = price.data[mint];
    const usdAmount = parseFloat(tokenPrice?.usdPrice || '0') * parseFloat(amount || '0');
    const frankUsdPrice = getCurrentValue();
    const frankAmount = usdAmount / frankUsdPrice;
    const convertIndecimal = frankAmount.toFixed(2) * 10 ** 6;
    console.log({ price, tokenPrice, usdAmount, frankUsdPrice, frankAmount, convertIndecimal });
    return { convertIndecimal, frankAmount, usdAmount };
  }
};

execute.post('/execute-Transaction', async (req, res) => {
  try {
    const { txSignature, mint } = req.body;

    if (txSignature) {
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      const preSignature = getTransaction(txSignature);
      if (preSignature?.status === 'found') {
        throw new Error('Transaction signature already processed');
      }
      const details = await connection.getTransaction(txSignature);
      const txData = extractTransactionDetails(details);
      const { amount: value, sender, receiver, type } = parseTransfer(details);
      const { convertIndecimal: toAmount, usdAmount } = await calculateTokenToBeSend(value, mint);
      if (txData && toAmount) {
        const { from } = txData;
        const signature = await sendTokenToUser(from || sender, toAmount);
        const txn = {
          ...txData,
          from: from || sender,
          to: receiver,
          amount: value,
          type: type || 'UNKNOWN',
          treasuryToUser: signature,
          timestamp: new Date().toISOString(),
        };
        setIncrementTokenCount(usdAmount);
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
