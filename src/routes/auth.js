import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { apiKeyGuard } from '../middleware/auth.js';
import { encrypt } from '../utils/crypto.js';
import { config } from '../config/index.js';

export const auth = Router();

// Example login (replace with real user store + password hashing)
auth.post('/auth/login', apiKeyGuard, (req, res) => {
  const { walletAddress } = req.body;
  const username = walletAddress;
  const token = jwt.sign({ userId: 1, username, role: 'user' }, config.jwtSecret, {
    expiresIn: '1h',
  });
  const key = config.encryptionKey;
  const packed = encrypt({
    plaintext: JSON.stringify({ success: true, token, user: { username, role: 'user' } }),
    key: key,
  });
  return res.json({
    data: {
      success: true,
      token,
    },
  });
});

auth.post('/auth/login-admin', apiKeyGuard, (req, res) => {
  const username = req.body.walletAddress;
  const token = jwt.sign({ userId: 1, username, role: 'admin' }, config.jwtSecret, {
    expiresIn: '1h',
  });
  const key = config.encryptionKey;
  const packed = encrypt({
    plaintext: JSON.stringify({ success: true, token, user: { username, role: 'admin' } }),
    key: key,
  });
  return res.json({
    data: {
      success: true,
      token,
    },
  });
});
