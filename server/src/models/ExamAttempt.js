import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: [true, 'Question reference is required'],
    },
    selectedAnswer: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    selectedAnswers: {
      type: [String],
      default: undefined,
    },
    marksAwarded: {
      type: Number,
      default: 0,
      min: [0, 'Marks awarded cannot be negative'],
    },
  },
  { _id: false }
);

const examAttemptSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Associated exam is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    score: {
      type: Number,
      default: 0,
      min: [0, 'Score cannot be negative'],
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks are required'],
      min: [0, 'Total marks cannot be negative'],
    },
    startedAt: {
      type: Date,
      required: [true, 'Start time is required'],
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['in_progress', 'submitted', 'auto_submitted'],
        message: '{VALUE} is not a valid attempt status',
      },
      default: 'in_progress',
    },
  },
  {
    timestamps: true,
  }
);

// Performance indexes for student attempt query patterns
// Note: Intentionally non-unique to allow multiple attempts if needed in future
examAttemptSchema.index({ student: 1, exam: 1, status: 1 });
examAttemptSchema.index({ student: 1, exam: 1 });
examAttemptSchema.index({ exam: 1, status: 1 });

const ExamAttempt = mongoose.model('ExamAttempt', examAttemptSchema);

export default ExamAttempt;
