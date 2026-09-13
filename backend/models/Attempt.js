const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    // The option _id the student selected, or null if left unanswered
    selectedOptionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    status: {
      type: String,
      enum: ['in-progress', 'submitted'],
      default: 'in-progress',
    },
    // Server-recorded start time - the timer is calculated from this on every
    // request, never trusted from the client, so it can't be manipulated.
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    wrongCount: {
      type: Number,
      default: 0,
    },
    unansweredCount: {
      type: Number,
      default: 0,
    },
    timeTaken: {
      // seconds, filled in on submit
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Single-attempt enforcement (decided requirement) - the DB itself rejects
// a second attempt document for the same student+quiz, as a backstop beyond
// the application-level check in the controller.
attemptSchema.index({ studentId: 1, quizId: 1 }, { unique: true });

module.exports = mongoose.model('Attempt', attemptSchema);
