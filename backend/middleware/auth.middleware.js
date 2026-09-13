const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { failure } = require('../utils/apiResponse');

// Verifies the JWT (read from the httpOnly cookie), then attaches
// { id, role, class, section } to req.user for downstream middleware/controllers.
// class/section are included because quiz visibility is scoped to a student's
// class/section (see student.controller.js) - without them here, that filtering
// silently breaks since req.user.class would be undefined.
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return failure(res, 401, 'Not authenticated. Please log in.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Confirm the user still exists and is active - covers cases where
    // a user was deleted/deactivated after the token was issued.
    const user = await User.findById(decoded.id);
    if (!user) {
      return failure(res, 401, 'User no longer exists');
    }
    if (!user.isActive) {
      return failure(res, 403, 'This account has been deactivated');
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      class: user.class,
      section: user.section,
    };
    next();
  } catch (error) {
    return failure(res, 401, 'Invalid or expired token. Please log in again.');
  }
};

module.exports = authMiddleware;
