const crypto = require('crypto');
const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

const ORGANIZER_CODE = process.env.ORGANIZER_CODE;
if (!ORGANIZER_CODE && process.env.NODE_ENV === 'production') {
  // Fail loudly rather than silently falling back to a guessable default in
  // production. Local/dev/test can still use a fallback for convenience.
  throw new Error('ORGANIZER_CODE environment variable must be set in production');
}
const EFFECTIVE_CODE = ORGANIZER_CODE || '123456';

// Constant-time comparison so response timing can't leak how many
// characters of the code were guessed correctly.
function safeCompare(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

router.post(
  '/organizer/login',
  loginLimiter,
  [body('code').isString().trim().isLength({ min: 1, max: 32 }).withMessage('Code is required')],
  validate,
  (req, res) => {
    const { code } = req.body;
    if (safeCompare(code, EFFECTIVE_CODE)) {
      return res.json({ success: true });
    }
    res.status(401).json({ success: false, message: 'Invalid organizer code' });
  }
);

module.exports = router;
