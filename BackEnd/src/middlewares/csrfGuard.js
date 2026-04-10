const config = require('../config');

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const buildAllowedOrigins = () => {
  const list = [];

  if (config.app?.frontendUrl) list.push(config.app.frontendUrl);

  if (config.cors?.origin && config.cors.origin !== '*') {
    config.cors.origin
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => list.push(item));
  }

  if (config.env !== 'production') {
    list.push('http://localhost:3000');
    list.push('http://localhost:5173');
    list.push('http://localhost:8080');
  }

  return Array.from(new Set(list));
};

const normalizeOrigin = (value) => {
  if (!value || typeof value !== 'string') return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const csrfGuard = (req, res, next) => {
  if (!MUTATING_METHODS.has(req.method)) return next();

  // Only enforce for cookie-based auth. Bearer token clients remain supported.
  if (!req.cookies?.token) return next();

  const allowedOrigins = buildAllowedOrigins();
  const origin = normalizeOrigin(req.headers.origin);
  const refererOrigin = normalizeOrigin(req.headers.referer);

  if (origin && allowedOrigins.includes(origin)) return next();
  if (!origin && refererOrigin && allowedOrigins.includes(refererOrigin)) return next();

  return res.status(403).json({
    success: false,
    message: 'CSRF check failed: invalid request origin',
    code: 'CSRF_ORIGIN_BLOCKED',
  });
};

module.exports = { csrfGuard };
