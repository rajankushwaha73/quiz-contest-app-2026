/**
 * MongoDB Atlas Vector Store Service:
 * - Persistent chunk & vector storage using DocumentChunk model.
 * - Deduplication via docHash (avoids re-processing identical documents).
 * - Vector similarity search using MongoDB Atlas $vectorSearch aggregation stage.
 * - Strict tenant/quiz isolation on (quizId, teacherId).
 */

const mongoose = require('mongoose');
const DocumentChunk = require('../../models/DocumentChunk');

/**
 * Computes cosine similarity between two vector arrays of equal length.
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number}
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Persists document chunks with vector embeddings to MongoDB Atlas.
 * If the exact same document (same docHash) already exists for this quizId,
 * existing chunks are reused to prevent duplicate vector data.
 * If a different document is uploaded for this quizId, old chunks for the quiz are replaced.
 *
 * @param {object} params
 * @param {string|mongoose.Types.ObjectId} params.quizId
 * @param {string|mongoose.Types.ObjectId} params.teacherId
 * @param {string} params.docHash - SHA-256 hash of extracted text/document
 * @param {string} params.fileName
 * @param {number} params.fileSize
 * @param {Array<{ chunkIndex: number, chunkText: string, charCount: number, tokenEstimate: number, embedding: number[] }>} params.chunksWithEmbeddings
 * @returns {Promise<DocumentChunk[]>}
 */
const saveOrReuseDocumentChunks = async ({
  quizId,
  teacherId,
  docHash,
  fileName,
  fileSize,
  chunksWithEmbeddings,
}) => {
  const quizObjId = new mongoose.Types.ObjectId(quizId);
  const teacherObjId = new mongoose.Types.ObjectId(teacherId);

  // 1. Check if identical document chunks already exist for this quiz
  const existingChunks = await DocumentChunk.find({
    quizId: quizObjId,
    docHash,
  }).sort({ chunkIndex: 1 });

  if (existingChunks.length > 0) {
    return existingChunks;
  }

  // 2. If a different document was previously uploaded for this quiz, remove old chunks
  await DocumentChunk.deleteMany({ quizId: quizObjId });

  // 3. Prepare and insert new chunks
  const chunkDocs = chunksWithEmbeddings.map((item) => ({
    quizId: quizObjId,
    teacherId: teacherObjId,
    docHash,
    chunkIndex: item.chunkIndex,
    chunkText: item.chunkText,
    embedding: item.embedding,
    metadata: {
      fileName: fileName || '',
      fileSize: fileSize || 0,
      charCount: item.charCount || item.chunkText.length,
      tokenEstimate: item.tokenEstimate || Math.ceil(item.chunkText.length / 4),
    },
  }));

  const inserted = await DocumentChunk.insertMany(chunkDocs);
  return inserted;
};

/**
 * Retrieves the most relevant document chunks from MongoDB Atlas using vector similarity search.
 * Filters strictly by quizId and teacherId.
 *
 * @param {object} params
 * @param {string|mongoose.Types.ObjectId} params.quizId
 * @param {string|mongoose.Types.ObjectId} params.teacherId
 * @param {number[]} params.queryEmbedding - Vector embedding of the search query
 * @param {number} [params.topK=6] - Number of chunks to retrieve
 * @returns {Promise<Array<{ chunkIndex: number, chunkText: string, score: number }>>}
 */
const retrieveRelevantChunks = async ({ quizId, teacherId, queryEmbedding, topK = 6 }) => {
  const quizObjId = new mongoose.Types.ObjectId(quizId);
  const teacherObjId = new mongoose.Types.ObjectId(teacherId);
  const indexName = process.env.ATLAS_VECTOR_INDEX_NAME || 'vector_index';

  // 1. Attempt native MongoDB Atlas $vectorSearch aggregation
  try {
    const pipeline = [
      {
        $vectorSearch: {
          index: indexName,
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: Math.max(topK * 10, 50),
          limit: topK,
          filter: {
            quizId: quizObjId,
            teacherId: teacherObjId,
          },
        },
      },
      {
        $project: {
          _id: 1,
          chunkIndex: 1,
          chunkText: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ];

    const results = await DocumentChunk.aggregate(pipeline);
    if (Array.isArray(results) && results.length > 0) {
      return results;
    }
  } catch (atlasSearchErr) {
    // If $vectorSearch is not configured yet in Atlas UI or index is building,
    // fallback to cosine similarity against the persisted chunks in MongoDB for this quiz
    console.warn(
      `Atlas $vectorSearch note: ${atlasSearchErr.message}. Executing similarity matching over persistent MongoDB chunks.`
    );
  }

  // 2. Persistent fallback: Retrieve stored chunks for this quiz and compute cosine similarity
  const storedChunks = await DocumentChunk.find({
    quizId: quizObjId,
    teacherId: teacherObjId,
  }).select('chunkIndex chunkText embedding');

  if (!storedChunks || storedChunks.length === 0) {
    return [];
  }

  // Score each chunk and take topK
  const scored = storedChunks.map((chunk) => ({
    _id: chunk._id,
    chunkIndex: chunk.chunkIndex,
    chunkText: chunk.chunkText,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
};

module.exports = {
  saveOrReuseDocumentChunks,
  retrieveRelevantChunks,
};
