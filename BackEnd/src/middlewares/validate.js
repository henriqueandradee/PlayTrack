const { validationResult } = require('express-validator');
const { error } = require('../shared/response.helper');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 'Validation failed', 422, 'VALIDATION_ERROR', {
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;
