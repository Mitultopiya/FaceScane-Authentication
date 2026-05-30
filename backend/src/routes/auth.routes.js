import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimit.middleware.js';
import {
  validate,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  faceDescriptorValidation,
  faceLoginValidation,
  sessionIdValidation,
} from '../middleware/validation.middleware.js';

const router = Router();

// Public routes
router.post('/register', authLimiter, registerValidation, validate, authController.register);
router.post('/login', authLimiter, loginValidation, validate, authController.login);
router.post('/face-login', authLimiter, faceLoginValidation, validate, authController.faceLogin);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, validate, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidation, validate, authController.resetPassword);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.post('/face-register', authenticate, faceDescriptorValidation, validate, authController.registerFace);
router.delete('/sessions/:sessionId', authenticate, sessionIdValidation, validate, authController.revokeSession);

// Admin routes
router.get('/admin/stats', authenticate, authorize('admin'), authController.getAdminStats);
router.get('/admin/users', authenticate, authorize('admin'), authController.getAdminUsers);
router.get('/admin/login-logs', authenticate, authorize('admin'), authController.getAdminLoginLogs);

export default router;
