const crypto = require('crypto');
const User = require('../models/User');
const { generateToken, sendTokenCookie } = require('../utils/generateToken');
const { success, failure } = require('../utils/apiResponse');
const sendEmail = require('../utils/sendEmail');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, class: studentClass, section } = req.body;

    if (!name || !email || !password) {
      return failure(res, 400, 'Name, email and password are required');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return failure(res, 400, 'A user with this email already exists');
    }

    // NOTE (temporary, Phase 2 only): anyone can self-register as student/teacher
    // for easy testing right now. From Phase 3 onward we will restrict "admin"
    // creation to admin-only APIs, and likely restrict teacher self-registration too.
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      class: studentClass || null,
      section: section || null,
    });

    const token = generateToken(user._id, user.role);
    sendTokenCookie(res, token);

    return success(res, 201, 'User registered successfully', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      class: user.class,
      section: user.section,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return failure(res, 400, 'Email and password are required');
    }

    // password has select:false in the schema, so explicitly include it here
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return failure(res, 401, 'Invalid email or password');
    }

    if (!user.isActive) {
      return failure(res, 403, 'This account has been deactivated. Contact your school admin.');
    }

    const token = generateToken(user._id, user.role);
    sendTokenCookie(res, token);

    return success(res, 200, 'Login successful', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      class: user.class,
      section: user.section,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (clears the auth cookie)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
  });
  return success(res, 200, 'Logged out successfully');
};

// @desc    Get the currently logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by authMiddleware - built in Phase 3.
    // For now (Phase 2) this route exists but isn't wired to middleware yet.
    const user = await User.findById(req.user.id);
    if (!user) {
      return failure(res, 404, 'User not found');
    }
    return success(res, 200, 'User profile fetched', user);
  } catch (error) {
    next(error);
  }
};

// @desc    Request a password reset link via email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return failure(res, 400, 'Email is required');
    }

    const user = await User.findOne({ email });

    // Always respond with the same generic message whether or not the email
    // exists - this prevents anyone from using this endpoint to discover
    // which emails are registered in the system.
    const genericMessage = 'If an account with that email exists, a password reset link has been sent.';

    if (!user) {
      return success(res, 200, genericMessage);
    }

    // Generate a random token; only its hash is stored in the DB, so a DB
    // leak alone can't be used to reset anyone's password.
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset your Quiz Contest password',
        html: `
          <p>Hi ${user.name},</p>
          <p>You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    } catch (emailError) {
      // Roll back the token if the email genuinely failed to send, so the
      // user isn't left with a dangling, unusable reset request.
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      console.error('Failed to send password reset email:', emailError.message);
      return failure(res, 500, 'Could not send reset email. Please try again later.');
    }

    return success(res, 200, genericMessage);
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using the token from the emailed link
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return failure(res, 400, 'Password must be at least 6 characters');
    }

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return failure(res, 400, 'This reset link is invalid or has expired. Please request a new one.');
    }

    user.password = password; // pre-save hook will hash this
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return success(res, 200, 'Password reset successfully. You can now log in with your new password.');
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser, logoutUser, getMe, forgotPassword, resetPassword };
