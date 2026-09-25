import mongoose from 'mongoose';

export const QUESTION_TYPES = ['SINGLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER'];

const questionSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Associated exam is required'],
    },
    questionType: {
      type: String,
      enum: {
        values: QUESTION_TYPES,
        message: '{VALUE} is not a supported question type',
      },
      default: 'SINGLE_CHOICE',
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      minlength: [3, 'Question text must be at least 3 characters'],
    },
    options: {
      type: [String],
      default: [],
    },
    correctAnswer: {
      type: String,
      trim: true,
      default: '',
    },
    correctAnswers: {
      type: [String],
      default: [],
    },
    acceptedAnswers: {
      type: [String],
      default: [],
    },
    marks: {
      type: Number,
      required: [true, 'Marks are required'],
      min: [0.5, 'Marks must be positive (at least 0.5)'],
      default: 1,
    },
    order: {
      type: Number,
      required: [true, 'Question order is required'],
      default: 1,
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: [2000, 'Explanation cannot exceed 2000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Normalize and validate options and answers based on questionType before validation
questionSchema.pre('validate', function () {
  if (!this.questionType) {
    this.questionType = 'SINGLE_CHOICE';
  }

  // Trim text fields
  if (this.questionText && typeof this.questionText === 'string') {
    this.questionText = this.questionText.trim();
  }
  if (this.explanation && typeof this.explanation === 'string') {
    this.explanation = this.explanation.trim();
  }

  // 1. TRUE_FALSE
  if (this.questionType === 'TRUE_FALSE') {
    this.options = ['True', 'False'];

    if (this.correctAnswer !== undefined && this.correctAnswer !== null) {
      const ca = String(this.correctAnswer).trim().toLowerCase();
      if (ca === 'true') {
        this.correctAnswer = 'True';
      } else if (ca === 'false') {
        this.correctAnswer = 'False';
      } else {
        this.invalidate('correctAnswer', 'Correct answer for True/False question must be "True" or "False"');
      }
    } else {
      this.invalidate('correctAnswer', 'Correct answer is required for True/False questions');
    }
  }

  // 2. SHORT_ANSWER
  else if (this.questionType === 'SHORT_ANSWER') {
    this.options = [];

    // Gather accepted answers from acceptedAnswers array or legacy correctAnswer
    let answers = [];
    if (Array.isArray(this.acceptedAnswers) && this.acceptedAnswers.length > 0) {
      answers = this.acceptedAnswers.map((a) => String(a).trim()).filter(Boolean);
    } else if (this.correctAnswer && String(this.correctAnswer).trim()) {
      answers = [String(this.correctAnswer).trim()];
    }

    if (answers.length === 0) {
      this.invalidate('acceptedAnswers', 'At least one accepted answer is required for short answer questions');
    } else {
      this.acceptedAnswers = answers;
      this.correctAnswer = answers[0];
    }
  }

  // 3. MULTIPLE_SELECT
  else if (this.questionType === 'MULTIPLE_SELECT') {
    if (!Array.isArray(this.options) || this.options.length < 2) {
      this.invalidate('options', 'At least 2 options are required for multiple select questions');
    } else {
      this.options = this.options.map((opt) => String(opt).trim()).filter(Boolean);
      if (this.options.length < 2) {
        this.invalidate('options', 'At least 2 non-empty options are required');
      }
    }

    let answers = [];
    if (Array.isArray(this.correctAnswers) && this.correctAnswers.length > 0) {
      answers = this.correctAnswers.map((a) => String(a).trim()).filter(Boolean);
    } else if (this.correctAnswer && String(this.correctAnswer).trim()) {
      answers = [String(this.correctAnswer).trim()];
    }

    if (answers.length === 0) {
      this.invalidate('correctAnswers', 'At least one correct answer must be selected for multiple select questions');
    } else {
      // Validate that all correct answers are present in options
      const invalidAnswers = answers.filter((a) => !this.options.includes(a));
      if (invalidAnswers.length > 0) {
        this.invalidate('correctAnswers', 'All correct answers must be one of the provided options');
      } else {
        this.correctAnswers = answers;
        this.correctAnswer = answers[0] || '';
      }
    }
  }

  // 4. SINGLE_CHOICE (Default & legacy)
  else {
    if (!Array.isArray(this.options) || this.options.length < 2) {
      this.invalidate('options', 'Question must have at least 2 non-empty options');
    } else {
      this.options = this.options.map((opt) => String(opt).trim()).filter(Boolean);
      if (this.options.length < 2) {
        this.invalidate('options', 'Question must have at least 2 non-empty options');
      }
    }

    if (this.correctAnswer && typeof this.correctAnswer === 'string') {
      this.correctAnswer = this.correctAnswer.trim();
    }

    if (!this.correctAnswer) {
      this.invalidate('correctAnswer', 'Correct answer is required');
    } else if (this.options && !this.options.includes(this.correctAnswer)) {
      this.invalidate('correctAnswer', 'Correct answer must be one of the provided options');
    }
  }
});

// Indexes for ordered fetching and exam association
questionSchema.index({ exam: 1, order: 1 });

const Question = mongoose.model('Question', questionSchema);

export default Question;
