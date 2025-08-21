import { Router } from 'express';
import { apiKeyGuard, authenticateToken } from '../middleware/auth.js';
import { decryptRequest } from '../middleware/decrypt.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { deleteTransaction, getTransaction } from '../utils/file.js';

export const txn = Router();

// Placeholder for file upload (use multer/busboy or object storage SDKs)
txn.post('/check-status', apiKeyGuard, authenticateToken, decryptRequest, async (req, res) => {
  const { txSignature } = req.body;

  if (txSignature) {
    const txn = getTransaction(txSignature);
    if (txn?.status === 'found') {
      return res.json(txn);
    } else {
      return res.json({ status: 'not_found', message: 'Transaction not found' });
    }
  }
});

txn.post(
  '/delete-trnasaction',
  apiKeyGuard,
  authenticateToken,
  decryptRequest,
  async (req, res) => {
    const { txSignature } = req.body;
    const { authorization } = req.headers;
    const { role } = jwt.verify(authorization?.replace('Bearer ', ''), config.jwtSecret);
    console.log({ role });

    if (role === 'admin' && txSignature) {
      const data = deleteTransaction(txSignature);
      return res.json({ data });
    } else if (role === 'admin' && !txSignature) {
      return res.status(400).json({ error: 'Missing transaction signature' });
    } else {
      return res.status(403).json({ error: 'You are not authorized' });
    }
  },
);
