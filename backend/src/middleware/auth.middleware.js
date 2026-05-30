import { verifyAccessToken } from '../utils/jwt.js';
import { findUserById } from '../models/user.model.js';
import { errorResponse } from '../utils/response.js';

/**
 * Authenticate JWT access token from Authorization header
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access token required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await findUserById(decoded.userId);

    if (!user || !user.is_active) {
      return errorResponse(res, 'User not found or inactive', 401);
    }

    req.user = user;
    req.sessionId = decoded.sessionId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Access token expired', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid access token', 401);
    }
    return errorResponse(res, 'Authentication failed', 401);
  }
};

/**
 * Role-based access control middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Insufficient permissions', 403);
    }

    next();
  };
};

export default { authenticate, authorize };
