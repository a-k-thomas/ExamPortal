import express from 'express';
import {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  publishExam,
  unpublishExam,
} from '../controllers/examController.js';
import {
  getQuestionsByExam,
  createQuestion,
} from '../controllers/questionController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All exam management routes require authentication and teacher/admin role
router.use(requireAuth);
router.use(requireRole('teacher', 'admin'));

// Question endpoints nested under exam (/api/exams/:examId/questions)
router.get('/:examId/questions', getQuestionsByExam);
router.post('/:examId/questions', createQuestion);

// Exam lifecycle actions (registered before /:id to prevent route shadowing)
router.patch('/:id/publish', publishExam);
router.patch('/:id/unpublish', unpublishExam);

// Exam CRUD endpoints
router.get('/', getExams);
router.get('/:id', getExamById);
router.post('/', createExam);
router.put('/:id', updateExam);
router.delete('/:id', deleteExam);

export default router;
