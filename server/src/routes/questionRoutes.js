import express from 'express';
import {
  getQuestionsByExam,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../controllers/questionController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// All question management routes require authentication and teacher/admin role
router.use(requireAuth);
router.use(requireRole('teacher', 'admin'));

// Question endpoints by exam alias (/api/questions/exam/:examId)
router.get('/exam/:examId', getQuestionsByExam);
router.post('/exam/:examId', createQuestion);

// Question item CRUD endpoints (/api/questions/:id)
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

export default router;
