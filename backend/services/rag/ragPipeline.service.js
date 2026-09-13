/**
 * RAG Quiz Generation Pipeline Orchestrator:
 * 1. PDF Text Extraction
 * 2. Text Cleaning
 * 3. Document Hashing & Deduplication
 * 4. Overlapping Chunking
 * 5. Embedding Generation
 * 6. Persistent MongoDB Atlas Vector Storage
 * 7. Relevant Vector Chunk Retrieval ($vectorSearch)
 * 8. Context Assembly & Grounded Prompting
 * 9. LLM MCQ Generation & Schema Validation
 */

const crypto = require('crypto');
const pdfParse = require('pdf-parse');
const { cleanText, chunkText } = require('./textChunker');
const aiProvider = require('./aiProvider.service');
const vectorStore = require('./vectorStore.service');
const DocumentChunk = require('../../models/DocumentChunk');

/**
 * Builds the grounded prompt containing ONLY retrieved context chunks.
 * @param {Array<{ chunkText: string, chunkIndex: number }>} chunks
 * @param {number} numberOfQuestions
 * @returns {string}
 */
const buildGroundedPrompt = (chunks, numberOfQuestions) => {
  const contextBlock = chunks
    .map((c, i) => `[Source Chunk ${i + 1} - Section ${c.chunkIndex + 1}]:\n${c.chunkText}`)
    .join('\n\n---\n\n');

  return `
You are an expert school assessment designer helping a teacher create a multiple-choice quiz from the retrieved study material.

GROUNDING RULES:
1. Generate exactly ${numberOfQuestions} multiple-choice questions based ONLY on the facts and concepts explicitly stated in the context chunks below.
2. Do NOT invent, assume, or extrapolate information not directly supported by the context.
3. Each question must have exactly 4 options with exactly one indisputably correct answer.
4. Distribute questions across different source chunks to ensure balanced coverage.

OUTPUT FORMAT:
Respond with ONLY a valid raw JSON array (no markdown code fences, no surrounding commentary).
Each item in the array must strictly match this structure:
{
  "questionText": "string",
  "options": ["string", "string", "string", "string"],
  "correctOptionIndex": 0,
  "marks": 1
}

correctOptionIndex must be a 0-based integer (0, 1, 2, or 3) indicating the correct option in the options array.

RETRIEVED DOCUMENT CHUNKS:
"""
${contextBlock}
"""
`.trim();
};

/**
 * Validates and formats the generated questions array to ensure compliance with the application's contract.
 * @param {Array} rawQuestions
 * @returns {Array<{ questionText: string, options: string[], correctOptionIndex: number, marks: number }>}
 */
const validateQuestions = (rawQuestions) => {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    const err = new Error('AI did not return any questions. Please try again with a document containing more text.');
    err.code = 'AI_EMPTY_RESULT';
    throw err;
  }

  const validQuestions = rawQuestions.filter(
    (q) =>
      q &&
      typeof q.questionText === 'string' &&
      q.questionText.trim().length > 0 &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.options.every((opt) => typeof opt === 'string' && opt.trim().length > 0) &&
      Number.isInteger(q.correctOptionIndex) &&
      q.correctOptionIndex >= 0 &&
      q.correctOptionIndex < 4
  );

  if (validQuestions.length === 0) {
    const err = new Error('AI returned questions in an unexpected structure. Please try again.');
    err.code = 'AI_INVALID_FORMAT';
    throw err;
  }

  return validQuestions.map((q) => ({
    questionText: q.questionText.trim(),
    options: q.options.map((opt) => opt.trim()),
    correctOptionIndex: q.correctOptionIndex,
    marks: typeof q.marks === 'number' && q.marks > 0 ? q.marks : 1,
  }));
};

/**
 * Executes the full RAG pipeline for an uploaded PDF.
 *
 * @param {object} params
 * @param {string|mongoose.Types.ObjectId} params.quizId
 * @param {string|mongoose.Types.ObjectId} params.teacherId
 * @param {Express.Multer.File} params.file - Uploaded PDF file object
 * @param {number} params.numberOfQuestions - Target number of questions to generate
 * @returns {Promise<Array<{ questionText: string, options: string[], correctOptionIndex: number, marks: number }>>}
 */
const generateQuestionsFromPDF = async ({ quizId, teacherId, file, numberOfQuestions = 5 }) => {
  // 1. Text extraction from PDF
  let parsed;
  try {
    parsed = await pdfParse(file.buffer);
  } catch (parseErr) {
    const err = new Error('Failed to read the PDF file. Please ensure it is a valid, uncorrupted PDF.');
    err.code = 'PDF_PARSE_ERROR';
    throw err;
  }

  const rawText = parsed.text || '';
  const cleaned = cleanText(rawText);

  if (!cleaned || cleaned.length < 50) {
    const err = new Error(
      'Could not extract sufficient text from this PDF. It may be scanned or image-based.'
    );
    err.code = 'PDF_EMPTY_TEXT';
    throw err;
  }

  // 2. Compute document SHA-256 hash for deduplication
  const docHash = crypto.createHash('sha256').update(cleaned).digest('hex');

  // 3. Check if chunks for this quiz + docHash are already persisted
  const existingCount = await DocumentChunk.countDocuments({ quizId, docHash });

  if (existingCount === 0) {
    // 4. Chunking (Overlapping sliding window: ~900 chars with ~150 chars overlap)
    const chunks = chunkText(cleaned, { chunkSize: 900, overlap: 150 });
    if (chunks.length === 0) {
      const err = new Error('No text chunks could be created from this document.');
      err.code = 'CHUNK_ERROR';
      throw err;
    }

    // 5. Generate embeddings for all chunks in batch
    const chunkTexts = chunks.map((c) => c.chunkText);
    const embeddings = await aiProvider.generateEmbeddings(chunkTexts);

    const chunksWithEmbeddings = chunks.map((c, i) => ({
      ...c,
      embedding: embeddings[i],
    }));

    // 6. Persist to MongoDB Atlas Vector Store
    await vectorStore.saveOrReuseDocumentChunks({
      quizId,
      teacherId,
      docHash,
      fileName: file.originalname || 'uploaded.pdf',
      fileSize: file.size || 0,
      chunksWithEmbeddings,
    });
  }

  // 7. Vector Retrieval: Generate a query embedding to retrieve the most representative, high-value chunks
  // We query for core facts, concepts, definitions, and key topics in the document
  const retrievalQuery =
    'Important core concepts, factual statements, key definitions, explanations, and main topics to test in a multiple-choice quiz.';
  const [queryEmbedding] = await aiProvider.generateEmbeddings([retrievalQuery]);

  // Determine topK based on number of questions (each question ideally references distinct information)
  const topK = Math.min(Math.max(numberOfQuestions * 2, 6), 15);

  const retrievedChunks = await vectorStore.retrieveRelevantChunks({
    quizId,
    teacherId,
    queryEmbedding,
    topK,
  });

  if (!retrievedChunks || retrievedChunks.length === 0) {
    const err = new Error('Could not retrieve relevant content from the document storage.');
    err.code = 'RETRIEVAL_EMPTY';
    throw err;
  }

  // 8. Grounded MCQ Generation via configured LLM provider
  const prompt = buildGroundedPrompt(retrievedChunks, numberOfQuestions);
  const systemInstruction =
    'You are a strict exam creator. You must generate high quality multiple choice questions grounded purely in the provided text snippets.';

  const rawCompletion = await aiProvider.generateCompletion(prompt, systemInstruction);

  // 9. Parse and validate JSON output
  let parsedJson;
  try {
    const jsonString = aiProvider.extractJson(rawCompletion);
    parsedJson = JSON.parse(jsonString);
  } catch (jsonErr) {
    const err = new Error('AI response could not be parsed. Please try again.');
    err.code = 'AI_PARSE_ERROR';
    throw err;
  }

  return validateQuestions(parsedJson);
};

module.exports = {
  generateQuestionsFromPDF,
};
