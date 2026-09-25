import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

// ─── POST /api/auth/register ─────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // Check for duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Always default to student — teachers/admins are created via seed script only
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,          // hashed by pre-save hook
      role: 'student',   // enforced server-side — never trust client role
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    // Mongoose unique index violation
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }
    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation failed.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Explicitly select password since schema uses select: false
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    // req.user is populated by requireAuth middleware
    return res.status(200).json({
      success: true,
      user: req.user.toPublicJSON(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user information.',
    });
  }
};
