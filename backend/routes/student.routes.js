const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { success } = require('../utils/apiResponse');
const { getAvailableQuizzes, getQuizDetails, joinContest } = require('../controllers/student.controller');
const {
  startAttempt,
  saveAnswer,
  submitAttempt,
  getMyResult,
  getLeaderboard,
  getAttemptHistory,
} = require('../controllers/attempt.controller');

// All routes below require a logged-in student
router.use(authMiddleware, roleMiddleware('student'));

// Kept from Phase 3 for quick manual verification of role protection
router.get('/test', (req, res) => {
  return success(res, 200, `Access granted. Hello student (id: ${req.user.id})`);
});

router.get('/quizzes', getAvailableQuizzes);
router.get('/quizzes/:id', getQuizDetails);
router.post('/quizzes/join', joinContest);

// Attempt engine
router.post('/quizzes/:id/start', startAttempt);
router.put('/attempts/:attemptId/answer', saveAnswer);
router.post('/attempts/:attemptId/submit', submitAttempt);

// Results
router.get('/quizzes/:id/result', getMyResult);
router.get('/quizzes/:id/leaderboard', getLeaderboard);
router.get('/attempts/history', getAttemptHistory);

module.exports = router;
