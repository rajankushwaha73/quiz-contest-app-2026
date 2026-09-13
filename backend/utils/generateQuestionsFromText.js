// AI QUESTION GENERATION (isolated feature - Phase: PDF-to-Quiz)
//
// This file is self-contained: it does not import or modify anything from
// the existing quiz/auth/scoring logic. If ANTHROPIC_API_KEY is not set,
// generateQuestionsFromText() throws a clear, catchable error instead of
// crashing the server - so the rest of the app keeps working untouched
// even before an API key is configured.
const aiProvider = require('../services/rag/aiProvider.service');

const buildPrompt = (text, numberOfQuestions) => `
You are helping a school teacher create a multiple-choice quiz from their study material.

Read the study material below and generate exactly ${numberOfQuestions} multiple-choice questions based ONLY on the content provided. Each question must have exactly 4 options, with exactly one correct answer.

Respond with ONLY a raw JSON array (no markdown code fences, no commentary, no explanation before or after). Each item in the array must have this exact shape:
{
  "questionText": "string",
  "options": ["string", "string", "string", "string"],
  "correctOptionIndex": 0,
  "marks": 1
}

correctOptionIndex is a 0-based index into the options array pointing to the correct answer.

Study material:
"""
${text}
"""
`.trim();

/**
 * Generates draft MCQ questions from raw text using the configured AI provider.
 * @param {string} text - source text
 * @param {number} numberOfQuestions - how many questions to generate
 * @returns {Promise<Array<{questionText, options, correctOptionIndex, marks}>>}
 */
const generateQuestionsFromText = async (text, numberOfQuestions = 5) => {
  const prompt = buildPrompt(text, numberOfQuestions);
  const rawText = await aiProvider.generateCompletion(prompt);

  let questions;
  try {
    questions = JSON.parse(aiProvider.extractJson(rawText));
  } catch (parseError) {
    const err = new Error('AI response could not be parsed. Please try again.');
    err.code = 'AI_PARSE_ERROR';
    throw err;
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    const err = new Error('AI did not return any questions. Try a document with more text content.');
    err.code = 'AI_EMPTY_RESULT';
    throw err;
  }

  const validQuestions = questions.filter(
    (q) =>
      q &&
      typeof q.questionText === 'string' &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      Number.isInteger(q.correctOptionIndex) &&
      q.correctOptionIndex >= 0 &&
      q.correctOptionIndex < 4
  );

  if (validQuestions.length === 0) {
    const err = new Error('AI returned questions in an unexpected format. Please try again.');
    err.code = 'AI_INVALID_FORMAT';
    throw err;
  }

  return validQuestions.map((q) => ({
    questionText: q.questionText,
    options: q.options,
    correctOptionIndex: q.correctOptionIndex,
    marks: typeof q.marks === 'number' && q.marks > 0 ? q.marks : 1,
  }));
};

module.exports = generateQuestionsFromText;
