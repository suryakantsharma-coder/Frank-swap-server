import { logger } from '../logger.js';

export function notFound(req, res) {
  res.status(404).json({ error: 'Endpoint not found' });
}

export function errorHandler(err, req, res, next) {
  // eslint-disable-line
  if (err?.message === 'Not allowed by CORS policy') {
    return res.status(403).json({ error: 'CORS: Origin not allowed' });
  }
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
}
