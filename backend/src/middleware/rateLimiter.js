const { rateLimit } = require('express-rate-limit');
const { loginRateLimit } = require('../config/env');

const loginLimiter = rateLimit({
  windowMs: loginRateLimit.windowMs,
  limit: loginRateLimit.max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      error: { status: 429, message: 'Too many login attempts, please try again later' },
    });
  },
});

module.exports = { loginLimiter };
