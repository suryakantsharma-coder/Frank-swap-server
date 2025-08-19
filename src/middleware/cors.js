import cors from 'cors';
import { config } from '../config/index.js';

export const corsMiddleware = cors({
  origin(origin, callback) {
    // allow non-browser clients (Postman/cURL)
    console.log({
      origin,
      allowOrignins: config.allowedOrigins,
      isAllowed: config.allowedOrigins.includes(origin),
    });
    if (!origin) return callback(null, true);
    if (config.allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Encrypted-Data',
    'X-Client-Signature',
    'X-Signature', // ← Add this
    'X-Timestamp', // ← Add this
    'X-CSRF-Token', // ← Add this
  ],
  optionsSuccessStatus: 200,
});
