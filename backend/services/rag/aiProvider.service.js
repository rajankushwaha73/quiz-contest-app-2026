/**
 * Google Gemini AI Provider Adapter for RAG:
 * - Separates LLM Question Generation from Embedding Generation.
 * - Uses Google's official @google/genai SDK.
 * - Configurable via GEMINI_API_KEY, GEMINI_MODEL, GEMINI_EMBEDDING_MODEL, GEMINI_EMBEDDING_DIMENSIONS.
 * - Throws catchable AI_NOT_CONFIGURED error if GEMINI_API_KEY is not set.
 */

const { GoogleGenAI } = require('@google/genai');

// ==========================================
// EMBEDDINGS (Google Gemini)
// ==========================================

/**
 * Generates vector embeddings for an array of text chunks using Gemini embedding model (gemini-embedding-2).
 * Default vector dimensionality is 768, explicitly requested and verified.
 *
 * @param {string[]} texts - Array of chunk strings to embed
 * @returns {Promise<Array<number[]>>} - Array of float vector embeddings
 */
const generateEmbeddings = async (texts) => {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.EMBEDDING_API_KEY || process.env.AI_API_KEY;

  if (!apiKey) {
    const err = new Error(
      'Gemini API is not configured yet. Set GEMINI_API_KEY in backend/.env to enable embedding generation.'
    );
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  const model = process.env.GEMINI_EMBEDDING_MODEL || process.env.EMBEDDING_MODEL || 'gemini-embedding-2';
  const targetDim = parseInt(process.env.GEMINI_EMBEDDING_DIMENSIONS || process.env.EMBEDDING_DIMENSIONS, 10) || 768;

  const ai = new GoogleGenAI({ apiKey });
  const embeddings = [];

  for (const text of texts) {
    const response = await ai.models.embedContent({
      model,
      contents: text,
      config: {
        outputDimensionality: targetDim,
      },
    });

    const values = response?.embeddings?.[0]?.values || response?.embedding?.values;

    if (Array.isArray(values) && values.length === targetDim) {
      embeddings.push(values);
    } else if (Array.isArray(values) && values.length > 0) {
      // If the API returned a different dimension despite config, ensure dimension is verified
      throw new Error(
        `Gemini embedding dimension mismatch: expected ${targetDim} values, but received ${values.length}.`
      );
    } else {
      const err = new Error('Gemini embedding request did not return valid vector values.');
      err.code = 'EMBEDDING_ERROR';
      throw err;
    }
  }

  return embeddings;
};

// ==========================================
// LLM COMPLETION (Google Gemini)
// ==========================================

/**
 * Helper to extract raw JSON from model text responses, stripping markdown code fences if present.
 */
const extractJson = (raw) => {
  const trimmed = (raw || '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced ? fenced[1] : trimmed;
};

/**
 * Generates chat completion text from a prompt using Gemini.
 * Default model: gemini-3.6-flash (current high-performance flash model).
 *
 * @param {string} prompt - User prompt containing grounded retrieved context
 * @param {string} systemInstruction - Optional system message
 * @returns {Promise<string>} - Raw text response from Gemini
 */
const generateCompletion = async (prompt, systemInstruction = '') => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

  if (!apiKey) {
    const err = new Error(
      'Gemini API is not configured yet. Set GEMINI_API_KEY in backend/.env to enable AI question generation.'
    );
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  const model = process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-3.6-flash';
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: systemInstruction || undefined,
      temperature: 0.3,
    },
  });

  return response.text || '';
};

module.exports = {
  generateEmbeddings,
  generateCompletion,
  extractJson,
};
