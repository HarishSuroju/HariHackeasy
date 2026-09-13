const { validationResult } = require('express-validator');

// Runs after an array of express-validator checks; short-circuits with a 400
// and a readable list of problems instead of letting bad input reach the
// in-memory store.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
  });
}

module.exports = { validate };
