import 'dotenv/config';

const required = (name, fallback = undefined) => {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
};

const parseArray = (csv = '') =>
  csv
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const getEncKey = () => {
  const b64 = process.env.ENCRYPTION_KEY_B64;
  const hex = process.env.ENCRYPTION_KEY_HEX;
  if (b64) return Buffer.from(b64, 'base64');
  if (hex) return Buffer.from(hex, 'hex');
  throw new Error('Provide ENCRYPTION_KEY_B64 or ENCRYPTION_KEY_HEX (32 bytes).');
};

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  apiKey: required('API_KEY'),
  jwtSecret: required('JWT_SECRET'),
  hmacSecret: required('HMAC_SECRET'),
  encryptionKey: getEncKey(), // 32 bytes for AES-256-GCM
  allowedOrigins: parseArray(process.env.ALLOWED_ORIGINS ?? ''),
};
