import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

/**
 * requireAuth middleware.
 * Reads Authorization: Bearer <token>, verifies JWT, attaches req.user.
 * Uses the database record as the authoritative source of role.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token is missing.',
      });
    }

    // Verify the JWT signature and expiry
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.',
        code: 'TOKEN_INVALID',
      });
    }

    // Fetch user from DB — role comes from DB, not token
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};

/**
 * requireRole(...roles) middleware factory.
 * Must be used after requireAuth — relies on req.user being set.
 * Role is always taken from the DB-fetched req.user, never the token payload.
 *
 * Usage:
 *   router.get('/admin-only', requireAuth, requireRole('admin'), handler)
 *   router.get('/manage', requireAuth, requireRole('teacher', 'admin'), handler)
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This endpoint requires one of these roles: ${roles.join(', ')}.`,
        yourRole: req.user.role,
      });
    }

    next();
  };
};
