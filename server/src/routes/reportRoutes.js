import express from 'express';
import {
  getExamReport,
  getExamStudentsReport,
  getExamQuestionsReport,
  getTeacherOverview,
  getAdminOverview,
  getAdminExams,
} from '../controllers/reportController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All reporting routes strictly require authentication
router.use(requireAuth);

// 1. Admin System-wide Reports (Admin role only)
router.get('/admin/overview', requireRole('admin'), getAdminOverview);
router.get('/admin/exams', requireRole('admin'), getAdminExams);

// 2. Teacher-level Overview (Teacher and Admin)
router.get('/teacher/overview', requireRole('teacher', 'admin'), getTeacherOverview);

// 3. Exam-level Reports (Teacher and Admin — ownership verified in controller/service)
router.get('/exams/:examId', requireRole('teacher', 'admin'), getExamReport);
router.get('/exams/:examId/students', requireRole('teacher', 'admin'), getExamStudentsReport);
router.get('/exams/:examId/questions', requireRole('teacher', 'admin'), getExamQuestionsReport);

export default router;
