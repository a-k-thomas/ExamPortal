import mongoose from 'mongoose';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';

/**
 * Helper: Check if user is authorized to manage the exam
 * Admin can manage any exam; teacher can only manage their own exam.
 */
const canManageExam = (exam, user) => {
  if (!exam || !user) return false;
  if (user.role === 'admin') return true;
  const creatorId = exam.createdBy?._id
    ? exam.createdBy._id.toString()
    : exam.createdBy?.toString();
  return creatorId === user._id.toString();
};

// ─── GET /api/exams ──────────────────────────────────────────────────────────
// List exams. Teachers see their own exams; Admins see all exams.
export const getExams = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    // Teacher can only list their own exams; Admin sees all
    if (req.user.role === 'teacher') {
      query.createdBy = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [exams, total] = await Promise.all([
      Exam.find(query)
        .populate('createdBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Exam.countDocuments(query),
    ]);

    // Attach question counts and total marks to each exam for management views
    const examIds = exams.map((e) => e._id);
    const questionStats = await Question.aggregate([
      { $match: { exam: { $in: examIds } } },
      {
        $group: {
          _id: '$exam',
          count: { $sum: 1 },
          totalMarks: { $sum: '$marks' },
        },
      },
    ]);

    const statsMap = {};
    questionStats.forEach((stat) => {
      statsMap[stat._id.toString()] = {
        questionCount: stat.count,
        totalMarks: stat.totalMarks,
      };
    });

    const enrichedExams = exams.map((exam) => {
      const stats = statsMap[exam._id.toString()] || { questionCount: 0, totalMarks: 0 };
      return {
        ...exam.toObject(),
        questionCount: stats.questionCount,
        totalMarks: stats.totalMarks,
      };
    });

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      exams: enrichedExams,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve exams.',
    });
  }
};

// ─── GET /api/exams/:id ──────────────────────────────────────────────────────
// Get single exam details with question count and total marks
export const getExamById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID format.',
      });
    }

    const exam = await Exam.findById(id).populate('createdBy', 'name email role');
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.',
      });
    }

    // Authorization check: Teacher can only view their own exam in management
    if (!canManageExam(exam, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view exams you created.',
      });
    }

    // Aggregate questions stats
    const questions = await Question.find({ exam: exam._id }).sort({ order: 1, createdAt: 1 });
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

    return res.status(200).json({
      success: true,
      exam: {
        ...exam.toObject(),
        questionCount: questions.length,
        totalMarks,
      },
      questions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve exam.',
    });
  }
};

// ─── POST /api/exams ─────────────────────────────────────────────────────────
// Create new exam. createdBy is strictly set from req.user._id
export const createExam = async (req, res) => {
  try {
    const { title, description, instructions, duration, startTime, endTime } = req.body;

    // Field presence checks
    if (!title || !duration || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, duration, start time, and end time.',
      });
    }

    const numDuration = Number(duration);
    if (isNaN(numDuration) || numDuration <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be a positive number of minutes.',
      });
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start time or end time date format.',
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time.',
      });
    }

    // Always enforce createdBy from authenticated user and status defaults to draft
    const exam = await Exam.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      instructions: instructions ? instructions.trim() : '',
      duration: numDuration,
      startTime: startDate,
      endTime: endDate,
      status: 'draft',
      createdBy: req.user._id,
    });

    const populatedExam = await Exam.findById(exam._id).populate('createdBy', 'name email role');

    return res.status(201).json({
      success: true,
      message: 'Exam created successfully in draft status.',
      exam: populatedExam,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation failed.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to create exam.',
    });
  }
};

// ─── PUT /api/exams/:id ──────────────────────────────────────────────────────
// Update exam details. Enforces ownership and date window validation.
export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID format.',
      });
    }

    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.',
      });
    }

    // Authorization check
    if (!canManageExam(exam, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own exams.',
      });
    }

    const { title, description, instructions, duration, startTime, endTime, status } = req.body;
    const updates = {};

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (instructions !== undefined) updates.instructions = instructions.trim();

    if (duration !== undefined) {
      const numDuration = Number(duration);
      if (isNaN(numDuration) || numDuration <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Duration must be a positive number of minutes.',
        });
      }
      updates.duration = numDuration;
    }

    // Validate window dates if either is provided
    const newStart = startTime !== undefined ? new Date(startTime) : exam.startTime;
    const newEnd = endTime !== undefined ? new Date(endTime) : exam.endTime;

    if (startTime !== undefined && isNaN(newStart.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start time.' });
    }
    if (endTime !== undefined && isNaN(newEnd.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid end time.' });
    }

    if (newEnd <= newStart) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time.',
      });
    }

    if (startTime !== undefined) updates.startTime = newStart;
    if (endTime !== undefined) updates.endTime = newEnd;

    // Direct status updates: prevent publishing via generic update without questions
    if (status !== undefined) {
      if (!['draft', 'published', 'archived'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value. Must be draft, published, or archived.',
        });
      }

      if (status === 'published') {
        const questionCount = await Question.countDocuments({ exam: exam._id });
        if (questionCount === 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot publish exam without at least one question.',
          });
        }
      }
      updates.status = status;
    }

    // createdBy can NEVER be changed by user
    delete updates.createdBy;

    const updatedExam = await Exam.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Exam updated successfully.',
      exam: updatedExam,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation failed.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update exam.',
    });
  }
};

// ─── DELETE /api/exams/:id ───────────────────────────────────────────────────
// Delete exam and prevent orphaned questions by deleting associated questions
export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID format.',
      });
    }

    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.',
      });
    }

    // Authorization check
    if (!canManageExam(exam, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own exams.',
      });
    }

    // Delete all associated questions to prevent orphaned records
    const deleteQuestionsResult = await Question.deleteMany({ exam: exam._id });
    await Exam.findByIdAndDelete(exam._id);

    return res.status(200).json({
      success: true,
      message: 'Exam and all associated questions deleted successfully.',
      deletedQuestionsCount: deleteQuestionsResult.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete exam.',
    });
  }
};

// ─── PATCH /api/exams/:id/publish ────────────────────────────────────────────
// Publish exam. Must have at least 1 question and not be archived.
export const publishExam = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID format.',
      });
    }

    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.',
      });
    }

    // Authorization check
    if (!canManageExam(exam, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only publish your own exams.',
      });
    }

    // Rule: Archived exam cannot be published directly
    if (exam.status === 'archived') {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish an archived exam. Revert to draft first.',
      });
    }

    // Rule: Must contain at least one valid question
    const questionCount = await Question.countDocuments({ exam: exam._id });
    if (questionCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish exam: At least one question is required.',
      });
    }

    exam.status = 'published';
    await exam.save();

    const populatedExam = await Exam.findById(exam._id).populate('createdBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Exam published successfully.',
      exam: {
        ...populatedExam.toObject(),
        questionCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to publish exam.',
    });
  }
};

// ─── PATCH /api/exams/:id/unpublish ──────────────────────────────────────────
// Unpublish exam (revert to draft)
export const unpublishExam = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID format.',
      });
    }

    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.',
      });
    }

    // Authorization check
    if (!canManageExam(exam, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only unpublish your own exams.',
      });
    }

    exam.status = 'draft';
    await exam.save();

    const populatedExam = await Exam.findById(exam._id).populate('createdBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Exam unpublished and reverted to draft status.',
      exam: populatedExam,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to unpublish exam.',
    });
  }
};
