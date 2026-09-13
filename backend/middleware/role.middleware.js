const { failure } = require('../utils/apiResponse');

// Usage: roleMiddleware('teacher', 'admin')
// Must run AFTER authMiddleware, since it relies on req.user being set.
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return failure(res, 401, 'Not authenticated');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return failure(res, 403, 'You do not have permission to access this resource');
    }

    next();
  };
};

module.exports = roleMiddleware;
