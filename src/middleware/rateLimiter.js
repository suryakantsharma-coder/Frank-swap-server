import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
  windowMs: 25 * 60 * 1000,
  max: 2200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, try again later.' },
});
