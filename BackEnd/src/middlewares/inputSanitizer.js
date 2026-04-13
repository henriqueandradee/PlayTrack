const sanitizeObject = (value) => {
  if (!value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeObject(item));
  }

  const sanitized = {};
  Object.keys(value).forEach((key) => {
    // Drop keys that can be used in operator injection payloads.
    if (key.startsWith('$') || key.includes('.')) {
      return;
    }
    sanitized[key] = sanitizeObject(value[key]);
  });

  return sanitized;
};

const inputSanitizer = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
};

module.exports = { inputSanitizer };
