import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT access token for a given user.
 * Payload contains minimum required identity info only.
 */
export const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Verify a JWT token string and return the decoded payload.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
