const Quiz = require('../models/Quiz');
const { success, failure } = require('../utils/apiResponse');

// Computes a simple time-based status so the frontend can group quizzes
// into Upcoming / Ongoing / Completed without doing date math itself.
const withTimeStatus = (quiz) => {
  const now = new Date();
  let timeStatus = 'upcoming';
  if (now >= quiz.startTime && now <= quiz.endTime) {
    timeStatus = 'ongoing';
  } else if (now > quiz.endTime) {
    timeStatus = 'completed';
  }
  return { ...quiz.toObject(), timeStatus };
};

// Escapes user-supplied text before using it inside a RegExp, so a class/section
// value containing regex special characters can't break or hijack the query.
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Class/section values are free-typed by teachers and students (e.g. "10" vs "10 ",
// "A" vs "a"), so we match case-insensitively and ignore surrounding whitespace
// instead of relying on the two humans typing byte-for-byte identical strings.
const buildClassSectionFilter = (user) => ({
  class: new RegExp(`^${escapeRegex(String(user.class).trim())}$`, 'i'),
  section: new RegExp(`^${escapeRegex(String(user.section).trim())}$`, 'i'),
});

// @desc    List all published quizzes visible to the logged-in student
//          (scoped to their class + section, per the class/section-scoped requirement)
// @route   GET /api/student/quizzes
// @access  Private (student)
const getAvailableQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({
      status: 'published',
      ...buildClassSectionFilter(req.user),
    }).sort({ startTime: 1 });

    return success(res, 200, 'Quizzes fetched', quizzes.map(withTimeStatus));
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single quiz's public details (for the instructions page)
// @route   GET /api/student/quizzes/:id
// @access  Private (student) - must match class/section and quiz must be published
const getQuizDetails = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      status: 'published',
      ...buildClassSectionFilter(req.user),
    });

    if (!quiz) {
      return failure(res, 404, 'Quiz not found or not available to you');
    }

    return success(res, 200, 'Quiz details fetched', withTimeStatus(quiz));
  } catch (error) {
    next(error);
  }
};

// @desc    Join a contest using a contest code
// @route   POST /api/student/quizzes/join
// @access  Private (student)
const joinContest = async (req, res, next) => {
  try {
    const { contestCode } = req.body;
    if (!contestCode) {
      return failure(res, 400, 'Contest code is required');
    }

    const quiz = await Quiz.findOne({ contestCode: contestCode.toUpperCase().trim() });

    if (!quiz) {
      return failure(res, 404, 'Invalid contest code');
    }
    if (quiz.status !== 'published') {
      return failure(res, 403, 'This quiz is not currently open for participation');
    }

    // Class/section scoping - decided requirement.
    // Compared case-insensitively and trimmed for the same reason as above.
    const quizClass = String(quiz.class).trim().toLowerCase();
    const quizSection = String(quiz.section).trim().toLowerCase();
    const userClass = String(req.user.class).trim().toLowerCase();
    const userSection = String(req.user.section).trim().toLowerCase();

    if (quizClass !== userClass || quizSection !== userSection) {
      return failure(res, 403, 'This contest is not available for your class/section');
    }

    return success(res, 200, 'Contest joined successfully', withTimeStatus(quiz));
  } catch (error) {
    next(error);
  }
};

module.exports = { getAvailableQuizzes, getQuizDetails, joinContest };
