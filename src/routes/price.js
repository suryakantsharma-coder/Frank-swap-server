import { Router } from 'express';
import { apiKeyGuard, authenticateToken } from '../middleware/auth.js';
import { decryptRequest } from '../middleware/decrypt.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { fetchJupiterPrices } from '../data/price.js';
import { setCurrentValue, getCurrentValue } from '../utils/dailyUpdateV2.js';
import { getValue, setValue } from '../utils/sellTokens.js';
import { getTokenBalance } from '../utils/solana-helper.js';

export const price = Router();

// Placeholder for file upload (use multer/busboy or object storage SDKs)
price.post('/price', apiKeyGuard, decryptRequest, async (req, res) => {
  const { tokens } = req.body;
  const getCurrentRateOfFranz = getCurrentValue();

  if (tokens?.length === 0) {
    return res.status(400).json({ error: 'No tokens provided' });
  }
  if (!Array.isArray(tokens)) {
    return res.status(400).json({ error: 'Tokens must be an array' });
  }

  if (tokens.length > 0) {
    const price = await fetchJupiterPrices(tokens);
    const balance = await getTokenBalance();
    return res.json({
      price: price?.data,
      currentRateOfFranz: getCurrentRateOfFranz,
      balance: `${balance}`,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({ data: 'failed' });
});

price.post('/token-count', apiKeyGuard, authenticateToken, decryptRequest, async (req, res) => {
  const count = await getValue('tokenCount');
  console.log({ sadfkld: count });
  return res.json({
    count,
    timestamp: new Date().toISOString(),
  });
});

price.post(
  '/set-frank-token-price',
  apiKeyGuard,
  authenticateToken,
  decryptRequest,
  async (req, res) => {
    const { usd } = req.body;
    const { authorization } = req.headers;
    const { role } = jwt.verify(authorization?.replace('Bearer ', ''), config.jwtSecret);
    console.log({ role });

    if (role === 'admin' && usd) {
      setCurrentValue(usd);
      return res.json({ data: 'Frank Token Price Changed' });
    }

    return res.status(403).json({ error: 'You are not authorized' });
  },
);

price.post('/set-token-count', apiKeyGuard, authenticateToken, decryptRequest, async (req, res) => {
  const { count } = req.body;
  const { authorization } = req.headers;
  const { role } = jwt.verify(authorization?.replace('Bearer ', ''), config.jwtSecret);
  console.log({ role });

  if (role === 'admin' && count) {
    setValue('tokenCount', count);
    return res.json({ data: 'Frank Token Price Changed' });
  }

  return res.status(403).json({ error: 'You are not authorized' });
});
