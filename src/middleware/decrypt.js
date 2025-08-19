import { config } from '../config/index.js';
import { decrypt } from '../utils/crypto.js';

export function decryptRequest(req, res, next) {
  const packed = req.header('X-Encrypted-Data');
  if (!packed) return next();
  try {
    const key = config.encryptionKey;
    const json = decrypt({ packed, key: key });
    req.body = JSON.parse(json);
    return next();
  } catch (e) {
    return res.status(400).json({ error: 'Failed to decrypt request data' });
  }
}
