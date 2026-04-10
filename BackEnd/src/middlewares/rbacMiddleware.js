const { forbidden } = require('../shared/response.helper');

const requireRole = (...roles) => (req, res, next) => {
  const userRole = req.user?.profile?.role;
  if (!userRole) {
    return forbidden(res, 'Role not found for authenticated user', 'ROLE_REQUIRED');
  }

  if (!roles.includes(userRole)) {
    return forbidden(res, 'Insufficient role permissions', 'INSUFFICIENT_ROLE');
  }

  next();
};

module.exports = { requireRole };
