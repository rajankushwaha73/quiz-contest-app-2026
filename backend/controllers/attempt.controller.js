const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const { success, failure } = require('../utils/apiResponse');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const classSectionFilter = (user) => ({
  class: new RegExp(`^${escapeRegex(String(user.class).trim())}$`, 'i'),
  section: new RegExp(`^${escapeRegex(String(user.section).trim())}$`, 'i'),
});

// Strips correctAnswer before sending questions to a student mid-attempt.
// SECURITY: this is the one place that matters most in the whole app -
// correct answers must never leave the server before submission.
const toStudentQuestion = (q) => ({
  _id: q._id,
  questionText: q.questionText,
  options: q.options.map((opt) => ({ _id: opt._id, text: opt.text })),
  marks: q.marks,
  negativeMarks: q.negativeMarks,
});

// Computes remaining seconds from server-recorded startedAt + quiz duration.
// Never trusts any time value from the client.
const getRemainingSeconds = (attempt, quiz) => {
  const elapsedMs = Date.now() - new Date(attempt.startedAt).getTime();
  const totalSeconds = quiz.duration * 60;
  const remaining = totalSeconds - Math.floor(elapsedMs / 1000);
  return Math.max(0, remaining);
};

// Shared scoring + finalization logic, used both by explicit submit and by
// auto-submit when time runs out.
const finalizeAttempt = async (attempt, quiz) => {
  const questions = await Question.find({ quizId: quiz._id });
  const answerMap = new Map(attempt.answers.map((a) => [a.questionId.toString(), a.selectedOptionId]));

  let score = 0;
  let totalMarks = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  for (const q of questions) {
    totalMarks += q.marks;
    const selected = answerMap.get(q._id.toString());

    if (!selected) {
      unansweredCount += 1;
      continue;
    }
    if (selected.toString() === q.correctAnswer.toString()) {
      correctCount += 1;
      score += q.marks;
    } else {
      wrongCount += 1;
      if (quiz.settings?.negativeMarking) {
        score -= q.negativeMarks;
      }
    }
  }

  attempt.status = 'submitted';
  attempt.submittedAt = new Date();
  attempt.timeTaken = Math.floor((attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 1000);
  attempt.score = score;
  attempt.totalMarks = totalMarks;
  attempt.correctCount = correctCount;
  attempt.wrongCount = wrongCount;
  attempt.unansweredCount = unansweredCount;

  await attempt.save();
  return attempt;
};

// @desc    Start a new attempt, or resume an in-progress one
// @route   POST /api/student/quizzes/:id/start
// @access  Private (student)
const startAttempt = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      status: 'published',
      ...classSectionFilter(req.user),
    });

    if (!quiz) {
      return failure(res, 404, 'Quiz not found or not available to you');
    }

    const now = new Date();
    if (now < quiz.startTime) {
      return failure(res, 403, 'This quiz has not started yet');
    }
    if (now > quiz.endTime) {
      return failure(res, 403, 'This quiz has ended');
    }

    // Atomic find-or-create: this eliminates the race condition where two
    // near-simultaneous requests (e.g. React re-rendering, double clicks, or
    // multiple tabs) could both see "no attempt exists" and both try to
    // create one, tripping the unique index and falsely reporting the quiz
    // as already attempted. MongoDB resolves concurrent upserts atomically,
    // so both requests safely resolve to the exact same document.
    let attempt = await Attempt.findOneAndUpdate(
      { studentId: req.user.id, quizId: quiz._id },
      { $setOnInsert: { startedAt: new Date(), status: 'in-progress', answers: [] } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (attempt.status === 'submitted') {
      return failure(res, 403, 'You have already submitted this quiz');
    }

    // If time already ran out since it was started (e.g. student closed the tab
    // and came back late), auto-finalize instead of letting them keep answering.
    const remainingSeconds = getRemainingSeconds(attempt, quiz);
    if (remainingSeconds <= 0 && attempt.status === 'in-progress') {
      await finalizeAttempt(attempt, quiz);
      return failure(res, 403, 'Time is up. This quiz has been automatically submitted.');
    }

    const questions = await Question.find({ quizId: quiz._id });
    const existingAnswers = {};
    attempt.answers.forEach((a) => {
      if (a.selectedOptionId) existingAnswers[a.questionId.toString()] = a.selectedOptionId.toString();
    });

    return success(res, 200, 'Attempt ready', {
      attemptId: attempt._id,
      quiz: { _id: quiz._id, title: quiz.title, duration: quiz.duration },
      questions: questions.map(toStudentQuestion),
      remainingSeconds,
      existingAnswers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Autosave a single answer as the student progresses
// @route   PUT /api/student/attempts/:attemptId/answer
// @access  Private (student, owner only)
const saveAnswer = async (req, res, next) => {
  try {
    const { questionId, selectedOptionId } = req.body;
    if (!questionId) {
      return failure(res, 400, 'questionId is required');
    }

    const attempt = await Attempt.findOne({ _id: req.params.attemptId, studentId: req.user.id });
    if (!attempt) {
      return failure(res, 404, 'Attempt not found');
    }
    if (attempt.status !== 'in-progress') {
      return failure(res, 403, 'This attempt has already been submitted');
    }

    const quiz = await Quiz.findById(attempt.quizId);
    if (getRemainingSeconds(attempt, quiz) <= 0) {
      await finalizeAttempt(attempt, quiz);
      return failure(res, 403, 'Time is up. This quiz has been automatically submitted.');
    }

    const existing = attempt.answers.find((a) => a.questionId.toString() === questionId);
    if (existing) {
      existing.selectedOptionId = selectedOptionId || null;
    } else {
      attempt.answers.push({ questionId, selectedOptionId: selectedOptionId || null });
    }

    await attempt.save();
    return success(res, 200, 'Answer saved');
  } catch (error) {
    next(error);
  }
};

// @desc    Submit the attempt - triggers secure server-side scoring
// @route   POST /api/student/attempts/:attemptId/submit
// @access  Private (student, owner only)
const submitAttempt = async (req, res, next) => {
  try {
    const attempt = await Attempt.findOne({ _id: req.params.attemptId, studentId: req.user.id });
    if (!attempt) {
      return failure(res, 404, 'Attempt not found');
    }
    if (attempt.status !== 'in-progress') {
      return failure(res, 403, 'This attempt has already been submitted');
    }

    const quiz = await Quiz.findById(attempt.quizId);
    await finalizeAttempt(attempt, quiz);

    // Deliberately not returning the score here - results are only visible
    // once the teacher releases them (decided requirement).
    return success(
      res,
      200,
      'Quiz submitted successfully. Your result will be available once your teacher releases it.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get the logged-in student's own result for a quiz (only once released)
// @route   GET /api/student/quizzes/:id/result
// @access  Private (student)
const getMyResult = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return failure(res, 404, 'Quiz not found');
    }

    const attempt = await Attempt.findOne({ quizId: quiz._id, studentId: req.user.id, status: 'submitted' });
    if (!attempt) {
      return failure(res, 404, 'You have not submitted this quiz');
    }

    if (!quiz.resultReleased) {
      return failure(res, 403, 'Your teacher has not released results for this quiz yet');
    }

    const base = {
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      unansweredCount: attempt.unansweredCount,
      timeTaken: attempt.timeTaken,
      submittedAt: attempt.submittedAt,
    };

    // Per-quiz setting: only include the answer-by-answer breakdown if the
    // teacher enabled it (decided at quiz creation time).
    if (!quiz.settings?.showAnswersAfterResult) {
      return success(res, 200, 'Result fetched', base);
    }

    const questions = await Question.find({ quizId: quiz._id });
    const answerMap = new Map(
      attempt.answers.map((a) => [a.questionId.toString(), a.selectedOptionId ? a.selectedOptionId.toString() : null])
    );

    const breakdown = questions.map((q) => ({
      questionText: q.questionText,
      options: q.options.map((o) => ({ _id: o._id.toString(), text: o.text })),
      correctOptionId: q.correctAnswer.toString(),
      selectedOptionId: answerMap.get(q._id.toString()) || null,
      marks: q.marks,
    }));

    return success(res, 200, 'Result fetched', { ...base, breakdown });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the leaderboard for a quiz (only visible once results are released)
// @route   GET /api/student/quizzes/:id/leaderboard
// @access  Private (student)
const getLeaderboard = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, ...classSectionFilter(req.user) });
    if (!quiz) {
      return failure(res, 404, 'Quiz not found or not available to you');
    }
    if (!quiz.resultReleased) {
      return failure(res, 403, 'Results have not been released yet');
    }

    const attempts = await Attempt.find({ quizId: quiz._id, status: 'submitted' })
      .populate('studentId', 'name')
      .sort({ score: -1, timeTaken: 1 });

    const leaderboard = attempts
      .filter((a) => a.studentId)
      .map((a, index) => ({
        rank: index + 1,
        studentName: a.studentId.name,
        score: a.score,
        timeTaken: a.timeTaken,
        isYou: a.studentId._id.toString() === req.user.id,
      }));

    return success(res, 200, 'Leaderboard fetched', leaderboard);
  } catch (error) {
    next(error);
  }
};

// @desc    Get the logged-in student's attempt history across all quizzes
// @route   GET /api/student/attempts/history
// @access  Private (student)
const getAttemptHistory = async (req, res, next) => {
  try {
    const attempts = await Attempt.find({ studentId: req.user.id, status: 'submitted' })
      .populate('quizId', 'title resultReleased')
      .sort({ submittedAt: -1 });

    const history = attempts
      .filter((a) => a.quizId) // guard against a deleted quiz leaving an orphaned attempt
      .map((a) => ({
        quizId: a.quizId._id,
        quizTitle: a.quizId.title,
        submittedAt: a.submittedAt,
        resultReleased: a.quizId.resultReleased,
        score: a.quizId.resultReleased ? a.score : null,
        totalMarks: a.quizId.resultReleased ? a.totalMarks : null,
      }));

    return success(res, 200, 'Attempt history fetched', history);
  } catch (error) {
    next(error);
  }
};

// @desc    Get the landing page preview leaderboard entries (latest released quiz top 5 scorers)
// @route   GET /api/leaderboard-preview
// @access  Public
const getLeaderboardPreview = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ resultReleased: true, status: 'published' }).sort({ updatedAt: -1 });
    if (!quiz) {
      return success(res, 200, 'No leaderboard preview available', {
        class: null,
        section: null,
        quizTitle: null,
        leaderboard: [],
      });
    }

    const attempts = await Attempt.find({ quizId: quiz._id, status: 'submitted' })
      .populate('studentId', 'name')
      .sort({ score: -1, timeTaken: 1 })
      .limit(5);

    const leaderboard = attempts
      .filter((a) => a.studentId)
      .map((a, index) => ({
        rank: index + 1,
        studentName: a.studentId.name,
        score: a.score,
      }));

    return success(res, 200, 'Leaderboard preview fetched', {
      class: quiz.class,
      section: quiz.section,
      quizTitle: quiz.title,
      leaderboard,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { startAttempt, saveAnswer, submitAttempt, getMyResult, getLeaderboard, getAttemptHistory, getLeaderboardPreview };
