import { Router } from 'express';
import { apiKeyGuard, authenticateToken } from '../middleware/auth.js';
import { validateClientSignature } from '../middleware/signature.js';
import { decryptRequest } from '../middleware/decrypt.js';
import { encrypt, hmacSha256Hex } from '../utils/crypto.js';
import { config } from '../config/index.js';

export const data = Router();

data.post(
  '/api/data',
  apiKeyGuard,
  validateClientSignature,
  authenticateToken,
  decryptRequest,
  (req, res) => {
    const response = {
      success: true,
      message: 'Data retrieved successfully',
      data: { user: req.user, requestData: req.body, timestamp: new Date().toISOString() },
    };
    const packed = encrypt({ plaintext: JSON.stringify(response), key: config.encryptionKey });
    const signature = hmacSha256Hex(config.hmacSecret, packed);
    res.json({ data: packed, signature });
  },
);
