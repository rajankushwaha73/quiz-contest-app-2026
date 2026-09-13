const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const { success, failure } = require('../utils/apiResponse');

// ---------- USER MANAGEMENT ----------

// @desc    List users, optionally filtered by role
// @route   GET /api/admin/users?role=student|teacher
// @access  Private (admin)
const getUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }
    const users = await User.find(filter).sort({ createdAt: -1 });
    return success(res, 200, 'Users fetched', users);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user directly (admin-provisioned account)
// @route   POST /api/admin/users
// @access  Private (admin)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, class: studentClass, section } = req.body;

    if (!name || !email || !password || !role) {
      return failure(res, 400, 'name, email, password and role are required');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return failure(res, 400, 'A user with this email already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      class: role === 'student' ? studentClass || null : null,
      section: role === 'student' ? section || null : null,
    });

    return success(res, 201, 'User created successfully', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      class: user.class,
      section: user.section,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate or deactivate a user
// @route   PATCH /api/admin/users/:id/toggle-active
// @access  Private (admin)
const toggleUserActive = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return failure(res, 400, 'You cannot deactivate your own account');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return failure(res, 404, 'User not found');
    }

    user.isActive = !user.isActive;
    await user.save();

    return success(res, 200, `User ${user.isActive ? 'activated' : 'deactivated'}`, {
      id: user._id,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user (cascades their quizzes/questions/attempts if a teacher,
//          or their attempts if a student, to avoid orphaned data)
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return failure(res, 400, 'You cannot delete your own account');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return failure(res, 404, 'User not found');
    }

    if (user.role === 'teacher') {
      const quizzes = await Quiz.find({ createdBy: user._id });
      const quizIds = quizzes.map((q) => q._id);
      await Question.deleteMany({ quizId: { $in: quizIds } });
      await Attempt.deleteMany({ quizId: { $in: quizIds } });
      await Quiz.deleteMany({ createdBy: user._id });
    } else if (user.role === 'student') {
      await Attempt.deleteMany({ studentId: user._id });
    }

    await user.deleteOne();
    return success(res, 200, 'User and associated data deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ---------- QUIZZES & RESULTS (cross-teacher visibility) ----------

// @desc    List all quizzes across all teachers
// @route   GET /api/admin/quizzes
// @access  Private (admin)
const getAllQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
    return success(res, 200, 'Quizzes fetched', quizzes);
  } catch (error) {
    next(error);
  }
};

// @desc    List all submitted attempts across all quizzes
// @route   GET /api/admin/results
// @access  Private (admin)
const getAllResults = async (req, res, next) => {
  try {
    const attempts = await Attempt.find({ status: 'submitted' })
      .populate('studentId', 'name email')
      .populate('quizId', 'title createdBy')
      .sort({ submittedAt: -1 });

    const results = attempts
      .filter((a) => a.studentId && a.quizId)
      .map((a) => ({
        attemptId: a._id,
        quizTitle: a.quizId.title,
        student: { name: a.studentId.name, email: a.studentId.email },
        score: a.score,
        totalMarks: a.totalMarks,
        submittedAt: a.submittedAt,
      }));

    return success(res, 200, 'Results fetched', results);
  } catch (error) {
    next(error);
  }
};

// ---------- ANALYTICS ----------

// @desc    Basic school-wide analytics
// @route   GET /api/admin/analytics
// @access  Private (admin)
const getAnalytics = async (req, res, next) => {
  try {
    const [totalStudents, totalTeachers, totalQuizzes, publishedQuizzes, totalAttempts] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Quiz.countDocuments(),
      Quiz.countDocuments({ status: 'published' }),
      Attempt.countDocuments({ status: 'submitted' }),
    ]);

    return success(res, 200, 'Analytics fetched', {
      totalStudents,
      totalTeachers,
      totalQuizzes,
      publishedQuizzes,
      totalAttempts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  toggleUserActive,
  deleteUser,
  getAllQuizzes,
  getAllResults,
  getAnalytics,
};
