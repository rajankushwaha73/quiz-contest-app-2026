const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
    },
    duration: {
      // in minutes
      type: Number,
      required: [true, 'Quiz duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      validate: {
        validator: function (value) {
          // 'this' refers to the document being validated on create;
          // on update via findOneAndUpdate this validator is skipped unless
          // runValidators + context: 'query' is set, so controllers double-check too.
          return !this.startTime || value > this.startTime;
        },
        message: 'End time must be after start time',
      },
    },
    contestCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'unpublished'],
      default: 'draft',
    },
    // Class/section scoping - decided requirement: quizzes are visible only
    // to students in the matching class + section.
    class: {
      type: String,
      trim: true,
      required: [true, 'Class is required'],
    },
    section: {
      type: String,
      trim: true,
      required: [true, 'Section is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    settings: {
      negativeMarking: {
        type: Boolean,
        default: false,
      },
      showAnswersAfterResult: {
        type: Boolean,
        default: true,
      },
    },
    // Decided requirement: results are hidden from students until the
    // teacher explicitly releases them.
    resultReleased: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Questions reference this quiz's _id rather than being embedded here,
// so question CRUD doesn't require rewriting the whole quiz document.
module.exports = mongoose.model('Quiz', quizSchema);
