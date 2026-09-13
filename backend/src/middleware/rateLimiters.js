const rateLimit = require('express-rate-limit');

// Brute-force protection for the organizer login endpoint. Six-digit codes
// have a small keyspace, so aggressive throttling matters here.
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

// General API throttle to reduce abuse / accidental hammering of the
// in-memory store.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

module.exports = { loginLimiter, apiLimiter };
