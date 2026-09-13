const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const generateContestCode = require('../utils/generateContestCode');
const { success, failure } = require('../utils/apiResponse');

// ---------- QUIZ CRUD ----------

// @desc    Create a new quiz (starts as draft)
// @route   POST /api/teacher/quizzes
// @access  Private (teacher)
const createQuiz = async (req, res, next) => {
  try {
    const { title, description, instructions, duration, startTime, endTime, class: cls, section, settings } = req.body;

    if (!title || !duration || !startTime || !endTime || !cls || !section) {
      return failure(res, 400, 'title, duration, startTime, endTime, class and section are required');
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return failure(res, 400, 'endTime must be after startTime');
    }

    // Ensure contest code uniqueness (extremely unlikely to collide, but check anyway)
    let contestCode;
    let exists = true;
    while (exists) {
      contestCode = generateContestCode();
      exists = await Quiz.findOne({ contestCode });
    }

    const quiz = await Quiz.create({
      title,
      description,
      instructions,
      duration,
      startTime,
      endTime,
      class: cls,
      section,
      settings,
      contestCode,
      createdBy: req.user.id,
    });

    return success(res, 201, 'Quiz created successfully', quiz);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all quizzes created by the logged-in teacher
// @route   GET /api/teacher/quizzes
// @access  Private (teacher)
const getMyQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    return success(res, 200, 'Quizzes fetched', quizzes);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single quiz (owned by this teacher) by id
// @route   GET /api/teacher/quizzes/:id
// @access  Private (teacher)
const getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!quiz) {
      return failure(res, 404, 'Quiz not found');
    }
    return success(res, 200, 'Quiz fetched', quiz);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a quiz (only allowed while not published, except publish/unpublish toggle)
// @route   PUT /api/teacher/quizzes/:id
// @access  Private (teacher, owner only)
const updateQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!quiz) {
      return failure(res, 404, 'Quiz not found');
    }

    const allowedFields = [
      'title',
      'description',
      'instructions',
      'duration',
      'startTime',
      'endTime',
      'class',
      'section',
      'settings',
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        quiz[field] = req.body[field];
      }
    });

    if (quiz.endTime <= quiz.startTime) {
      return failure(res, 400, 'endTime must be after startTime');
    }

    await quiz.save();
    return success(res, 200, 'Quiz updated successfully', quiz);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a quiz (and its questions)
// @route   DELETE /api/teacher/quizzes/:id
// @access  Private (teacher, owner only)
const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!quiz) {
      return failure(res, 404, 'Quiz not found');
    }

    await Question.deleteMany({ quizId: quiz._id });
    await quiz.deleteOne();

    return success(res, 200, 'Quiz and its questions deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Publish or unpublish a quiz
// @route   PATCH /api/teacher/quizzes/:id/publish
// @access  Private (teacher, owner only)
const togglePublish = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!quiz) {
      return failure(res, 404, 'Quiz not found');
    }

    if (quiz.status === 'published') {
      quiz.status = 'unpublished';
    } else {
      // Require at least one question before a quiz can go live
      const questionCount = await Question.countDocuments({ quizId: quiz._id });
      if (questionCount === 0) {
        return failure(res, 400, 'Cannot publish a quiz with no questions');
      }
      quiz.status = 'published';
    }

    await quiz.save();
    return success(res, 200, `Quiz ${quiz.status}`, quiz);
  } catch (error) {
    next(error);
  }
};

// ---------- QUESTION CRUD ----------

// @desc    Add a question to a quiz
// @route   POST /api/teacher/quizzes/:quizId/questions
// @access  Private (teacher, owner only)
const addQuestion = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.quizId, createdBy: req.user.id });
    if (!quiz) {
      return failure(res, 404, 'Quiz not found');
    }

    const { questionText, options, correctOptionIndex, marks, negativeMarks } = req.body;

    if (!questionText || !options || options.length < 2 || correctOptionIndex === undefined) {
      return failure(res, 400, 'questionText, at least 2 options, and correctOptionIndex are required');
    }
    if (correctOptionIndex < 0 || correctOptionIndex >= options.length) {
      return failure(res, 400, 'correctOptionIndex is out of range');
    }

    // Build options first so we can reference the generated _id of the correct one
    const question = new Question({
      quizId: quiz._id,
      questionText,
      options: options.map((text) => ({ text })),
      marks: marks ?? 1,
      negativeMarks: negativeMarks ?? 0,
    });
    question.correctAnswer = question.options[correctOptionIndex]._id;

    await question.save();
    return success(res, 201, 'Question added successfully', question);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all questions for a quiz (teacher view - includes correct answers)
// @route   GET /api/teacher/quizzes/:quizId/questions
// @access  Private (teacher, owner only)
const getQuestions = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.quizId, createdBy: req.user.id });
    if (!quiz) {
      return failure(res, 404, 'Quiz not found');
    }

    const questions = await Question.find({ quizId: quiz._id });
    return success(res, 200, 'Questions fetched', questions);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a question
// @route   PUT /api/teacher/questions/:id
// @access  Private (teacher, owner only via quiz ownership)
const updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return failure(res, 404, 'Question not found');
    }

    const quiz = await Quiz.findOne({ _id: question.quizId, createdBy: req.user.id });
    if (!quiz) {
      // Either the quiz doesn't exist or this teacher doesn't own it
      return failure(res, 403, 'You do not have permission to edit this question');
    }

    const { questionText, options, correctOptionIndex, marks, negativeMarks } = req.body;

    if (questionText !== undefined) question.questionText = questionText;
    if (marks !== undefined) question.marks = marks;
    if (negativeMarks !== undefined) question.negativeMarks = negativeMarks;

    if (options !== undefined) {
      if (options.length < 2) {
        return failure(res, 400, 'A question must have at least 2 options');
      }
      question.options = options.map((text) => ({ text }));
      // Options were rebuilt, so correctOptionIndex must be supplied to re-point correctAnswer
      if (correctOptionIndex === undefined) {
        return failure(res, 400, 'correctOptionIndex is required when updating options');
      }
    }

    if (correctOptionIndex !== undefined) {
      if (correctOptionIndex < 0 || correctOptionIndex >= question.options.length) {
        return failure(res, 400, 'correctOptionIndex is out of range');
      }
      question.correctAnswer = question.options[correctOptionIndex]._id;
    }

    await question.save();
    return success(res, 200, 'Question updated successfully', question);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a question
// @route   DELETE /api/teacher/questions/:id
// @access  Private (teacher, owner only via quiz ownership)
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return failure(res, 404, 'Question not found');
    }

    const quiz = await Quiz.findOne({ _id: question.quizId, createdBy: req.user.id });
    if (!quiz) {
      return failure(res, 403, 'You do not have permission to delete this question');
    }

    await question.deleteOne();
    return success(res, 200, 'Question deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ---------- RESULTS ----------

// @desc    Release results for a quiz so students can view their scores
// @route   PATCH /api/teacher/quizzes/:id/release-result
// @access  Private (teacher, owner only)
const releaseResult = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!quiz) {
      return failure(res, 404, 'Quiz not found');
    }

    quiz.resultReleased = true;
    await quiz.save();

    return success(res, 200, 'Results released to students', quiz);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all submitted attempts/results for a quiz, ranked by score
// @route   GET /api/teacher/quizzes/:id/results
// @access  Private (teacher, owner only)
const getQuizResults = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!quiz) {
      return failure(res, 404, 'Quiz not found');
    }

    const attempts = await Attempt.find({ quizId: quiz._id, status: 'submitted' })
      .populate('studentId', 'name email')
      .sort({ score: -1, timeTaken: 1 });

    const results = attempts
      .filter((a) => a.studentId) // guard against a deleted student leaving an orphaned attempt
      .map((a, index) => ({
        rank: index + 1,
        attemptId: a._id,
        student: { id: a.studentId._id, name: a.studentId.name, email: a.studentId.email },
        score: a.score,
        totalMarks: a.totalMarks,
        correctCount: a.correctCount,
        wrongCount: a.wrongCount,
        unansweredCount: a.unansweredCount,
        timeTaken: a.timeTaken,
        submittedAt: a.submittedAt,
      }));

    return success(res, 200, 'Results fetched', {
      quiz: { _id: quiz._id, title: quiz.title, resultReleased: quiz.resultReleased },
      results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuiz,
  getMyQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  togglePublish,
  addQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  releaseResult,
  getQuizResults,
};
