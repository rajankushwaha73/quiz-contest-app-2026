const mongoose = require('mongoose');

const documentChunkSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'quizId is required'],
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'teacherId is required'],
      index: true,
    },
    docHash: {
      type: String,
      required: [true, 'docHash is required'],
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: [true, 'chunkIndex is required'],
    },
    chunkText: {
      type: String,
      required: [true, 'chunkText is required'],
    },
    embedding: {
      type: [Number],
      required: [true, 'embedding vector is required'],
    },
    metadata: {
      fileName: { type: String, default: '' },
      fileSize: { type: Number, default: 0 },
      charCount: { type: Number, default: 0 },
      tokenEstimate: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Compound index for fast lookup of document chunks per quiz and hash
documentChunkSchema.index({ quizId: 1, docHash: 1 });
documentChunkSchema.index({ quizId: 1, chunkIndex: 1 });

module.exports = mongoose.model('DocumentChunk', documentChunkSchema);
