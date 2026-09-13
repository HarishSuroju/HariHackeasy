function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: 'Route not found' });
}

// Express recognizes error middleware by its 4-argument signature.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error' : err.message,
  });
}

module.exports = { notFoundHandler, errorHandler };
