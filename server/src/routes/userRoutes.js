import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateProfile,
  updateUserRole,
  deleteUser,
} from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All user routes require authentication
router.use(requireAuth);

// Authenticated user updates own profile
router.put('/profile', updateProfile);

// Admin & Teacher: view users (teachers are scoped to students in controller)
router.get('/', requireRole('admin', 'teacher'), getAllUsers);
router.get('/:id', requireRole('admin', 'teacher'), getUserById);
router.put('/:id/role', requireRole('admin'), updateUserRole);
router.delete('/:id', requireRole('admin'), deleteUser);

export default router;
