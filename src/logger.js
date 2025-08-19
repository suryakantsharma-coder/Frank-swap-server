import pino from 'pino';
import pinoHttp from 'pino-http';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

  paths: [
    'req.headers["x-api-key"]', // ✅ redact API key
    'req.headers.authorization', // redact bearer tokens
    'req.body.password', // redact sensitive body fields
  ],

  censor: '[REDACTED]',

  redact: {
    paths: ['req.headers["x-api-key"]'],
    censor: '[REDACTED]',
  },
});

export const httpLogger = pinoHttp({ logger });
