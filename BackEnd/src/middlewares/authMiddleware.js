const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const { unauthorized } = require('../shared/response.helper');

/**
 * Protect middleware — verifies JWT from cookie OR Authorization header and attaches user to req.user
 * Priority: Cookie (httpOnly) > Authorization header (para compatibilidade com mobile)
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Tenta ler do cookie primeiro (httpOnly)
  if (req.cookies?.token) {
    token = req.cookies.token;
  }
  // 2. Fallback para Authorization header (mobile, desktop clients)
  else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return unauthorized(res, 'Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return unauthorized(res, 'User not found');
    }

    const tokenVersionFromJwt = Number.isInteger(decoded.tv) ? decoded.tv : 0;
    const currentTokenVersion = Number.isInteger(req.user.tokenVersion) ? req.user.tokenVersion : 0;
    if (tokenVersionFromJwt !== currentTokenVersion) {
      return unauthorized(res, 'Session is no longer valid. Please log in again.');
    }

    if (typeof req.user.canLogin === 'function' && !req.user.canLogin()) {
      return unauthorized(res, 'Account is deleted or inactive');
    }

    next();
  } catch (err) {
    return unauthorized(res, 'Not authorized, token invalid or expired');
  }
};

module.exports = { protect };
