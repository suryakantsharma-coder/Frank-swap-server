import express from 'express';
import { config } from './config/index.js';
import { httpLogger } from './logger.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { corsMiddleware } from './middleware/cors.js';
import { limiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/error.js';

import { execute } from './routes/execute.js';
import { auth } from './routes/auth.js';
import { data } from './routes/data.js';
import { price } from './routes/price.js';
import { startDailyUpdater } from './utils/dailyUpdate.js';

const app = express();

// HTTPS enforcement behind proxies (e.g., Nginx/Heroku/Cloudflare)
app.enable('trust proxy');
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

startDailyUpdater();

app.use(httpLogger);
app.use(securityHeaders);
app.use(limiter);
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Routes
app.use(execute);
app.use(auth);
app.use(data);
app.use(price);

// 404 + error handler
app.use('*', notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`🔒 Secure server running on port ${config.port}`);
  console.log(`🌍 Environment: ${config.env}`);
  console.log(
    '🛡️  Security features enabled: CORS, rate limiting, request encryption, JWT, API key, request signing',
  );
});
