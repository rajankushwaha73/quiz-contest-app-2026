const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Option text is required'],
      trim: true,
    },
  },
  { _id: true } // each option gets its own id so we can reference it as the correct answer
);

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: (arr) => arr.length >= 2,
        message: 'A question must have at least 2 options',
      },
    },
    // Stores the _id of the correct option within `options`.
    // SECURITY: this field must NEVER be sent to students before submission -
    // controllers serving students must explicitly exclude it via .select('-correctAnswer')
    // or by mapping the response manually.
    correctAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Correct answer must be specified'],
    },
    marks: {
      type: Number,
      required: [true, 'Marks value is required'],
      min: [0, 'Marks cannot be negative'],
      default: 1,
    },
    negativeMarks: {
      type: Number,
      min: [0, 'Negative marks cannot be negative (store as a positive number to subtract)'],
      default: 0,
    },
  },
  { timestamps: true }
);

// Validate that correctAnswer actually matches one of the provided option ids.
questionSchema.pre('validate', function (next) {
  if (this.options && this.correctAnswer) {
    const validIds = this.options.map((opt) => opt._id.toString());
    if (!validIds.includes(this.correctAnswer.toString())) {
      return next(new Error('correctAnswer must match the _id of one of the provided options'));
    }
  }
  next();
});

module.exports = mongoose.model('Question', questionSchema);
