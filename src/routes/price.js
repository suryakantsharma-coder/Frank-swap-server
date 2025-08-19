import { Router } from 'express';
import { apiKeyGuard, authenticateToken } from '../middleware/auth.js';
import { decryptRequest } from '../middleware/decrypt.js';
import { encrypt } from '../utils/crypto.js';
import { config } from '../config/index.js';
import { fetchJupiterPrices } from '../data/price.js';
import { getCurrentValue } from '../utils/dailyUpdate.js';

export const price = Router();

// Placeholder for file upload (use multer/busboy or object storage SDKs)
price.post('/price', apiKeyGuard, authenticateToken, decryptRequest, async (req, res) => {
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
    console.log('Fetched prices:', price.data);
    return res.json({
      price: price?.data,
      currentRateOfFranz: getCurrentRateOfFranz,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({ data: 'failed' });
});
