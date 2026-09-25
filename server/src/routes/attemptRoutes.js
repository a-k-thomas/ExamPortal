import express from 'express';
import {
  getAvailableExams,
  startAttempt,
  getMyAttempt,
  saveAnswer,
  submitAttempt,
  getAttemptResult,
  getMyAttempts,
} from '../controllers/attemptController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All student attempt routes strictly require authentication and student role
router.use(requireAuth);
router.use(requireRole('student'));

// 1. Static and sub-resource routes (declared first to prevent route shadowing by /:id)
router.get('/available-exams', getAvailableExams);
router.post('/exams/:examId/start', startAttempt);
router.get('/my-attempts', getMyAttempts);

// 2. Lifecycle actions on existing attempt
router.patch('/:id/answer', saveAnswer);
router.put('/:id/answer', saveAnswer); // alias for client flexibility
router.post('/:id/submit', submitAttempt);

// 3. Attempt results (sub-resource under attempt)
router.get('/:id/result', getAttemptResult);

// 4. Attempt details (declared last among GETs)
router.get('/:id', getMyAttempt);

export default router;
