// AI QUESTION GENERATION CONTROLLER (isolated feature)
//
// This controller only READS the Quiz model (for the ownership check) and
// does not write to Quiz/Question/Attempt at all. Generated questions are
// returned to the teacher for review - they are added to the quiz only
// when the teacher explicitly submits them via the EXISTING
// POST /api/teacher/quizzes/:quizId/questions endpoint (addQuestion in
// teacher.controller.js), which is completely untouched by this feature.

const Quiz = require('../models/Quiz');
const ragPipeline = require('../services/rag/ragPipeline.service');
const { success, failure } = require('../utils/apiResponse');

// @desc    Process uploaded PDF via RAG (chunking, embedding, Atlas vector search)
//          and generate grounded draft MCQ questions for teacher review
// @route   POST /api/teacher/quizzes/:quizId/generate-questions
// @access  Private (teacher, owner only)
const generateQuestionsFromPDF = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.quizId, createdBy: req.user.id });
    if (!quiz) {
      return failure(res, 404, 'Quiz not found');
    }

    if (!req.file) {
      return failure(res, 400, 'No PDF file was uploaded. Please attach a PDF.');
    }
    if (req.file.mimetype !== 'application/pdf') {
      return failure(res, 400, 'Only PDF files are supported.');
    }

    let numberOfQuestions = parseInt(req.body.numberOfQuestions, 10);
    if (!Number.isInteger(numberOfQuestions) || numberOfQuestions < 1) {
      numberOfQuestions = 5;
    }
    if (numberOfQuestions > 15) {
      numberOfQuestions = 15; // defensive cap to control AI cost/latency per request
    }

    const draftQuestions = await ragPipeline.generateQuestionsFromPDF({
      quizId: req.params.quizId,
      teacherId: req.user.id,
      file: req.file,
      numberOfQuestions,
    });

    return success(res, 200, 'Questions generated. Please review before adding them to your quiz.', draftQuestions);
  } catch (error) {
    // Friendly, specific messages for the known AI-related error codes;
    // anything else falls through to the existing global error handler.
    if (error.code === 'AI_NOT_CONFIGURED') {
      return failure(res, 503, error.message);
    }
    if (
      [
        'AI_PARSE_ERROR',
        'AI_EMPTY_RESULT',
        'AI_INVALID_FORMAT',
        'PDF_PARSE_ERROR',
        'PDF_EMPTY_TEXT',
        'CHUNK_ERROR',
        'RETRIEVAL_EMPTY',
      ].includes(error.code)
    ) {
      return failure(res, 502, error.message);
    }
    next(error);
  }
};

module.exports = { generateQuestionsFromPDF };
