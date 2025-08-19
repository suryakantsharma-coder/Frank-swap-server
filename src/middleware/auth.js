import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export function apiKeyGuard(req, res, next) {
  const apiKey = req.header('X-API-Key');
  if (!apiKey || apiKey !== config.apiKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  next();
}

export function authenticateToken(req, res, next) {
  const authHeader = req.header('Authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, config.jwtSecret, (err, payload) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = payload;
    next();
  });
}
