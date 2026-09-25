import mongoose from 'mongoose';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';

/**
 * Helper: Check if user is authorized to manage questions on the exam
 */
const canManageExam = (exam, user) => {
  if (!exam || !user) return false;
  if (user.role === 'admin') return true;
  const creatorId = exam.createdBy?._id
    ? exam.createdBy._id.toString()
    : exam.createdBy?.toString();
  return creatorId === user._id.toString();
};

// ─── GET /api/exams/:examId/questions ─────────────────────────────────────────
// Fetch all questions for an exam in sequential order (teacher/admin management endpoint)
export const getQuestionsByExam = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID format.',
      });
    }

    const exam = await Exam.findById(examId);
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
        message: 'Access denied. You can only view questions for your own exams.',
      });
    }

    const questions = await Question.find({ exam: exam._id }).sort({ order: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve questions.',
    });
  }
};

// ─── POST /api/exams/:examId/questions ────────────────────────────────────────
// Add a new question to an exam
export const createQuestion = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID format.',
      });
    }

    const exam = await Exam.findById(examId);
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
        message: 'Access denied. You can only add questions to your own exams.',
      });
    }

    const {
      questionText,
      questionType = 'SINGLE_CHOICE',
      options,
      correctAnswer,
      correctAnswers,
      acceptedAnswers,
      explanation,
      marks,
      order,
    } = req.body;

    const allowedTypes = ['SINGLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER'];
    const resolvedType = questionType || 'SINGLE_CHOICE';
    if (!allowedTypes.includes(resolvedType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question type. Must be SINGLE_CHOICE, MULTIPLE_SELECT, TRUE_FALSE, or SHORT_ANSWER.',
      });
    }

    if (!questionText || !questionText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question text is required.',
      });
    }

    // Type-specific preliminary validation
    if (resolvedType === 'SINGLE_CHOICE') {
      if (!options || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'At least 2 options are required for single choice questions.',
        });
      }
      if (correctAnswer === undefined || correctAnswer === null || String(correctAnswer).trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'A correct answer must be selected from the options.',
        });
      }
    } else if (resolvedType === 'MULTIPLE_SELECT') {
      if (!options || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'At least 2 options are required for multiple select questions.',
        });
      }
      const rawCorrect = Array.isArray(correctAnswers) && correctAnswers.length > 0
        ? correctAnswers
        : correctAnswer ? [correctAnswer] : [];
      if (rawCorrect.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least 1 correct answer must be selected for multiple select questions.',
        });
      }
    } else if (resolvedType === 'TRUE_FALSE') {
      if (correctAnswer === undefined || correctAnswer === null) {
        return res.status(400).json({
          success: false,
          message: 'Correct answer is required for True/False questions.',
        });
      }
      const norm = String(correctAnswer).trim().toLowerCase();
      if (norm !== 'true' && norm !== 'false') {
        return res.status(400).json({
          success: false,
          message: 'Correct answer for True/False questions must be "True" or "False".',
        });
      }
    } else if (resolvedType === 'SHORT_ANSWER') {
      const rawAccepted = Array.isArray(acceptedAnswers) && acceptedAnswers.length > 0
        ? acceptedAnswers
        : correctAnswer ? [correctAnswer] : [];
      const trimmedAccepted = rawAccepted.map((a) => String(a).trim()).filter(Boolean);
      if (trimmedAccepted.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least 1 accepted answer is required for short answer questions.',
        });
      }
    }

    // Auto-calculate order if not supplied or invalid
    let questionOrder = order !== undefined ? Number(order) : undefined;
    if (questionOrder === undefined || isNaN(questionOrder)) {
      const highestOrder = await Question.findOne({ exam: exam._id }).sort({ order: -1 });
      questionOrder = highestOrder ? highestOrder.order + 1 : 1;
    }

    const numMarks = marks !== undefined ? Number(marks) : 1;
    if (isNaN(numMarks) || numMarks <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Marks must be a positive number.',
      });
    }

    const question = await Question.create({
      exam: exam._id,
      questionType: resolvedType,
      questionText: questionText.trim(),
      options: Array.isArray(options) ? options.map((opt) => String(opt).trim()) : [],
      correctAnswer: correctAnswer !== undefined ? String(correctAnswer).trim() : '',
      correctAnswers: Array.isArray(correctAnswers) ? correctAnswers.map((a) => String(a).trim()) : [],
      acceptedAnswers: Array.isArray(acceptedAnswers) ? acceptedAnswers.map((a) => String(a).trim()) : [],
      explanation: explanation !== undefined && explanation !== null ? String(explanation).trim() : '',
      marks: numMarks,
      order: questionOrder,
    });

    return res.status(201).json({
      success: true,
      message: 'Question created successfully.',
      question,
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
      message: 'Failed to create question.',
    });
  }
};

// ─── PUT /api/questions/:id ──────────────────────────────────────────────────
// Update an existing question
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID format.',
      });
    }

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found.',
      });
    }

    const exam = await Exam.findById(question.exam);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Associated exam not found.',
      });
    }

    // Authorization check
    if (!canManageExam(exam, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update questions for your own exams.',
      });
    }

    const {
      questionText,
      questionType,
      options,
      correctAnswer,
      correctAnswers,
      acceptedAnswers,
      explanation,
      marks,
      order,
    } = req.body;

    if (questionType !== undefined) {
      const allowedTypes = ['SINGLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER'];
      if (!allowedTypes.includes(questionType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid question type. Must be SINGLE_CHOICE, MULTIPLE_SELECT, TRUE_FALSE, or SHORT_ANSWER.',
        });
      }
      question.questionType = questionType;
    }

    if (questionText !== undefined) {
      if (!questionText.trim()) {
        return res.status(400).json({ success: false, message: 'Question text cannot be empty.' });
      }
      question.questionText = questionText.trim();
    }

    if (options !== undefined) {
      question.options = Array.isArray(options) ? options.map((opt) => String(opt).trim()) : [];
    }

    if (correctAnswer !== undefined) {
      question.correctAnswer = String(correctAnswer).trim();
    }

    if (correctAnswers !== undefined) {
      question.correctAnswers = Array.isArray(correctAnswers) ? correctAnswers.map((a) => String(a).trim()) : [];
    }

    if (acceptedAnswers !== undefined) {
      question.acceptedAnswers = Array.isArray(acceptedAnswers) ? acceptedAnswers.map((a) => String(a).trim()) : [];
    }

    if (explanation !== undefined) {
      question.explanation = explanation !== null ? String(explanation).trim() : '';
    }

    if (marks !== undefined) {
      const numMarks = Number(marks);
      if (isNaN(numMarks) || numMarks <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Marks must be a positive number.',
        });
      }
      question.marks = numMarks;
    }

    if (order !== undefined) {
      const numOrder = Number(order);
      if (isNaN(numOrder)) {
        return res.status(400).json({ success: false, message: 'Order must be a valid number.' });
      }
      question.order = numOrder;
    }

    // Save with Mongoose document validation
    await question.save();

    return res.status(200).json({
      success: true,
      message: 'Question updated successfully.',
      question,
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
      message: 'Failed to update question.',
    });
  }
};

// ─── DELETE /api/questions/:id ───────────────────────────────────────────────
// Delete a single question
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID format.',
      });
    }

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found.',
      });
    }

    const exam = await Exam.findById(question.exam);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Associated exam not found.',
      });
    }

    // Authorization check
    if (!canManageExam(exam, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete questions from your own exams.',
      });
    }

    await Question.findByIdAndDelete(question._id);

    return res.status(200).json({
      success: true,
      message: 'Question deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete question.',
    });
  }
};
