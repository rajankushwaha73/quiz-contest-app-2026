const jwt = require('jsonwebtoken');

// Generates a signed JWT containing the user's id and role.
// Role is embedded here so roleMiddleware doesn't need an extra DB lookup.
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Sets the JWT as an httpOnly cookie on the response.
// httpOnly means client-side JS cannot read it - reduces XSS token theft risk.
const sendTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

module.exports = { generateToken, sendTokenCookie };
