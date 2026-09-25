import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [5000, 'Instructions cannot exceed 5000 characters'],
      default: '',
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
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
          if (!this.startTime || !value) return true;
          return new Date(value) > new Date(this.startTime);
        },
        message: 'End time must be after start time',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'published', 'archived'],
        message: '{VALUE} is not a valid exam status',
      },
      default: 'draft',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook to guarantee endTime > startTime in document validation
examSchema.pre('validate', function () {
  if (this.startTime && this.endTime && new Date(this.endTime) <= new Date(this.startTime)) {
    this.invalidate('endTime', 'End time must be after start time');
  }
});

// Indexes for query performance
examSchema.index({ createdBy: 1 });
examSchema.index({ status: 1, startTime: 1, endTime: 1 });

const Exam = mongoose.model('Exam', examSchema);

export default Exam;
