import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { apiKeyGuard } from '../middleware/auth.js';
import { encrypt } from '../utils/crypto.js';
import { config } from '../config/index.js';

export const auth = Router();

// Example login (replace with real user store + password hashing)
auth.post('/auth/login', apiKeyGuard, (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'secure123') {
    const token = jwt.sign({ userId: 1, username, role: 'admin' }, config.jwtSecret, {
      expiresIn: '1h',
    });
    const key = config.encryptionKey;
    console.log({ key: key });
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
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});
