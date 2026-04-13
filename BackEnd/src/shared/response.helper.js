/**
 * Standardized API response helpers.
 * Use these in all controllers to guarantee consistent response shape.
 */

const success = (res, data, statusCode = 200, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...meta,
  });
};

const created = (res, data, meta = {}) => {
  return success(res, data, 201, meta);
};

const noContent = (res) => {
  return res.status(204).send();
};

const error = (res, message, statusCode = 400, code = null, extra = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(code && { code }),
    ...extra,
  });
};

const notFound = (res, resource = 'Resource') => {
  return error(res, `${resource} not found`, 404, 'NOT_FOUND');
};

const forbidden = (res, message = 'Not authorized', code = 'FORBIDDEN') => {
  return error(res, message, 403, code);
};

const unauthorized = (res, message = 'Authentication required') => {
  return error(res, message, 401, 'UNAUTHORIZED');
};

const planLimitReached = (res, message, code = 'LIMIT_REACHED') => {
  return res.status(403).json({
    success: false,
    message,
    code,
    upgradeRequired: true,
  });
};

module.exports = {
  success,
  created,
  noContent,
  error,
  notFound,
  forbidden,
  unauthorized,
  planLimitReached,
};
