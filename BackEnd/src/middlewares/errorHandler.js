const config = require('../config');
const logger = require('../shared/logger');

const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  logger.error('Request failed', {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code: err.code || null,
    message: err.message,
    stack: config.env === 'development' ? err.stack : undefined,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    // Debug helper: keeps API response concise while surfacing root cause in server logs
    console.error('[ValidationError]', {
      message: err.message,
      path: req.originalUrl,
      method: req.method,
      model: err?.errors ? Object.values(err.errors)[0]?.properties?.path : undefined,
      fields: Object.keys(err.errors || {}),
    });

    return res.status(422).json({
      success: false,
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      errors: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      code: 'DUPLICATE_KEY',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      code: 'AUTH_ERROR',
    });
  }

  // Generic
  const isDev = config.env === 'development';

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
