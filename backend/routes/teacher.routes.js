const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { success } = require('../utils/apiResponse');
const {
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
} = require('../controllers/teacher.controller');
// NEW (isolated AI feature) - does not affect any of the imports/logic above
const { generateQuestionsFromPDF } = require('../controllers/ai.controller');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } }); // 15MB cap

// All routes below require a logged-in teacher
router.use(authMiddleware, roleMiddleware('teacher'));

// Kept from Phase 3 for quick manual verification of role protection
router.get('/test', (req, res) => {
  return success(res, 200, `Access granted. Hello teacher (id: ${req.user.id})`);
});

// Quiz CRUD
router.post('/quizzes', createQuiz);
router.get('/quizzes', getMyQuizzes);
router.get('/quizzes/:id', getQuizById);
router.put('/quizzes/:id', updateQuiz);
router.delete('/quizzes/:id', deleteQuiz);
router.patch('/quizzes/:id/publish', togglePublish);
router.patch('/quizzes/:id/release-result', releaseResult);
router.get('/quizzes/:id/results', getQuizResults);

// Question CRUD (nested under quiz for add/list, flat for update/delete)
router.post('/quizzes/:quizId/questions', addQuestion);
router.get('/quizzes/:quizId/questions', getQuestions);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// NEW (isolated AI feature): teacher uploads a PDF, gets back DRAFT questions
// for review. Nothing is saved here - saving still goes through the existing
// addQuestion route above, unchanged.
router.post('/quizzes/:quizId/generate-questions', upload.single('pdf'), generateQuestionsFromPDF);

module.exports = router;
