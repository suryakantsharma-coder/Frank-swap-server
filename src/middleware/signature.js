import { config } from '../config/index.js';
import { hmacSha256Hex } from '../utils/crypto.js';

export function validateClientSignature(req, res, next) {
  const signature = req.header('X-Client-Signature');
  const timestamp = req.header('X-Timestamp');
  if (!signature || !timestamp) {
    return res.status(401).json({ error: 'Missing security headers' });
  }
  const now = Date.now();
  if (Math.abs(now - Number(timestamp)) > 5 * 60 * 1000) {
    return res.status(401).json({ error: 'Request timestamp expired' });
  }
  const payload = `${timestamp}:${JSON.stringify(req.body ?? {})}`;
  const expected = hmacSha256Hex(config.hmacSecret, payload);
  if (signature !== expected) return res.status(401).json({ error: 'Invalid request signature' });
  next();
}
