import crypto from 'crypto';

// AES-256-GCM with random IV and auth tag
export function encrypt({ plaintext, key }) {
  if (!Buffer.isBuffer(key) || key.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (Buffer).');
  }
  const iv = crypto.randomBytes(12); // GCM recommended 12-byte IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // pack as base64: iv.ciphertext.tag
  return Buffer.concat([iv, ciphertext, tag]).toString('base64');
}

export function decrypt({ packed, key }) {
  const buf = Buffer.from(packed, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(buf.length - 16);
  const data = buf.subarray(12, buf.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  return plaintext;
}

export function hmacSha256Hex(secret, payload) {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}
