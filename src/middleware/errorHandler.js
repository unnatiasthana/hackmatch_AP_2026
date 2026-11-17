const env = require('../config/env');

// Express recognises error handlers by their four-argument signature.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Map common PostgreSQL error codes to HTTP statuses.
  const pgMap = { '23505': 409, '23503': 400, '23502': 400, '22P02': 400 };
  const status = err.status || err.statusCode || pgMap[err.code] || 500;
  const isServerError = status >= 500;

  if (isServerError) console.error(err);

  res.status(status).json({
    success: false,
    message:
      isServerError && env.nodeEnv === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
  });
}

module.exports = errorHandler;
