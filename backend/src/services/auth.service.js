import config from '../config/index.js';
import { sendPasswordResetEmail } from '../config/mail.js';
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserPassword,
  updateFaceDescriptor,
  getAllUsers,
  getUserStats,
} from '../models/user.model.js';
import {
  createSession,
  findSessionByRefreshToken,
  updateSessionActivity,
  revokeSession,
  revokeAllUserSessions,
  getUserSessions,
} from '../models/session.model.js';
import { createLoginLog, getLoginLogs, getRecentLoginLogsForUser } from '../models/loginLog.model.js';
import {
  createPasswordResetToken,
  findValidResetToken,
  markResetTokenUsed,
} from '../models/passwordReset.model.js';
import {
  hashPassword,
  comparePassword,
  generateSecureToken,
  hashToken,
  facesMatch,
  parseUserAgent,
} from '../utils/crypto.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  parseExpiryToMs,
} from '../utils/jwt.js';
import { AppError } from '../utils/response.js';

/**
 * Validate liveness detection data from client
 */
const validateLiveness = (livenessData) => {
  if (!livenessData) return { valid: false, reason: 'Liveness data missing' };

  const {
    blinkDetected,
    headMovementDetected,
    antiSpoofScore,
    frameCount = 0,
  } = livenessData;

  if (!headMovementDetected) {
    return { valid: false, reason: 'Head movement not detected - move your head slightly' };
  }

  if (typeof antiSpoofScore === 'number' && antiSpoofScore < 0.3) {
    return { valid: false, reason: 'Use a live camera feed (not a photo)' };
  }

  // Blink OR sustained live scan (30+ frames ~3–4 seconds)
  const hasBlinkOrSustainedScan = blinkDetected || frameCount >= 30;
  if (!hasBlinkOrSustainedScan) {
    return { valid: false, reason: 'Blink once or keep scanning for a few more seconds' };
  }

  return { valid: true };
};

/**
 * Create auth tokens and session
 */
const createAuthSession = async (user, req, rememberMe = false) => {
  const { deviceType, deviceName } = parseUserAgent(req.headers['user-agent']);
  const ipAddress = req.ip || req.connection?.remoteAddress;

  const refreshToken = generateRefreshToken({ userId: user.id }, rememberMe);
  const refreshTokenHash = hashToken(refreshToken);

  const expiresIn = rememberMe ? config.jwt.rememberMeExpiresIn : config.jwt.refreshExpiresIn;
  const expiresAt = new Date(Date.now() + parseExpiryToMs(expiresIn));

  const session = await createSession({
    userId: user.id,
    refreshTokenHash,
    deviceName,
    deviceType,
    ipAddress,
    userAgent: req.headers['user-agent'],
    isRememberMe: rememberMe,
    expiresAt,
  });

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
    sessionId: session.id,
  });

  return { accessToken, refreshToken, session };
};

/**
 * Register new user
 */
export const register = async (req) => {
  const { name, email, password } = req.body;

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ name, email, passwordHash });

  await createLoginLog({
    userId: user.id,
    email: user.email,
    loginMethod: 'registration',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    success: true,
  });

  return { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

/**
 * Manual email/password login
 */
export const login = async (req) => {
  const { email, password, rememberMe = false } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  const user = await findUserByEmail(email);

  if (!user) {
    await createLoginLog({
      email,
      loginMethod: 'password',
      ipAddress,
      userAgent,
      success: false,
      failureReason: 'User not found',
    });
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.is_active) {
    await createLoginLog({
      userId: user.id,
      email,
      loginMethod: 'password',
      ipAddress,
      userAgent,
      success: false,
      failureReason: 'Account inactive',
    });
    throw new AppError('Account is deactivated', 403);
  }

  const validPassword = await comparePassword(password, user.password_hash);

  if (!validPassword) {
    await createLoginLog({
      userId: user.id,
      email,
      loginMethod: 'password',
      ipAddress,
      userAgent,
      success: false,
      failureReason: 'Invalid password',
    });
    throw new AppError('Invalid email or password', 401);
  }

  const tokens = await createAuthSession(user, req, rememberMe);

  await createLoginLog({
    userId: user.id,
    email,
    loginMethod: 'password',
    ipAddress,
    userAgent,
    success: true,
    metadata: { rememberMe, sessionId: tokens.session.id },
  });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (req) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new AppError('Refresh token required', 401);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const tokenHash = hashToken(refreshToken);
  const session = await findSessionByRefreshToken(tokenHash);

  if (!session || session.user_id !== decoded.userId) {
    throw new AppError('Session not found or expired', 401);
  }

  if (!session.is_active) {
    throw new AppError('Account is deactivated', 403);
  }

  await updateSessionActivity(session.id);

  const accessToken = generateAccessToken({
    userId: session.user_id,
    role: session.role,
    sessionId: session.id,
  });

  return {
    accessToken,
    user: { id: session.user_id, name: session.name, email: session.email, role: session.role },
  };
};

/**
 * Logout - revoke current session
 */
export const logout = async (req) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    const session = await findSessionByRefreshToken(tokenHash);
    if (session) {
      await revokeSession(session.id, session.user_id);
    }
  } else if (req.sessionId && req.user) {
    await revokeSession(req.sessionId, req.user.id);
  }

  return { message: 'Logged out successfully' };
};

/**
 * Register face descriptor for authenticated user
 */
export const registerFace = async (req) => {
  const { descriptor, livenessData } = req.body;

  const liveness = validateLiveness(livenessData);
  if (!liveness.valid) {
    throw new AppError(liveness.reason, 400);
  }

  const result = await updateFaceDescriptor(req.user.id, descriptor);

  await createLoginLog({
    userId: req.user.id,
    email: req.user.email,
    loginMethod: 'face_registration',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    success: true,
  });

  return { faceRegisteredAt: result.face_registered_at };
};

/**
 * Face scan login
 */
export const faceLogin = async (req) => {
  const { email, descriptor, livenessData } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  const liveness = validateLiveness(livenessData);
  if (!liveness.valid) {
    await createLoginLog({
      email,
      loginMethod: 'face',
      ipAddress,
      userAgent,
      success: false,
      failureReason: liveness.reason,
    });
    throw new AppError(liveness.reason, 400);
  }

  const user = await findUserByEmail(email);

  if (!user) {
    await createLoginLog({
      email,
      loginMethod: 'face',
      ipAddress,
      userAgent,
      success: false,
      failureReason: 'User not found',
    });
    throw new AppError('Invalid credentials', 401);
  }

  if (!user.is_active) {
    throw new AppError('Account is deactivated', 403);
  }

  if (!user.face_descriptor) {
    await createLoginLog({
      userId: user.id,
      email,
      loginMethod: 'face',
      ipAddress,
      userAgent,
      success: false,
      failureReason: 'Face not registered',
    });
    throw new AppError('Face not registered for this account', 400);
  }

  const storedDescriptor = typeof user.face_descriptor === 'string'
    ? JSON.parse(user.face_descriptor)
    : user.face_descriptor;

  const { match, distance } = facesMatch(descriptor, storedDescriptor);

  if (!match) {
    await createLoginLog({
      userId: user.id,
      email,
      loginMethod: 'face',
      ipAddress,
      userAgent,
      success: false,
      failureReason: 'Face mismatch',
      metadata: { distance, threshold: config.security.faceMatchThreshold },
    });
    throw new AppError('Face verification failed', 401);
  }

  const tokens = await createAuthSession(user, req, false);

  await createLoginLog({
    userId: user.id,
    email,
    loginMethod: 'face',
    ipAddress,
    userAgent,
    success: true,
    metadata: { distance, sessionId: tokens.session.id },
  });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    matchAccuracy: Math.max(0, (1 - distance) * 100).toFixed(1),
  };
};

/**
 * Forgot password - send reset email
 */
export const forgotPassword = async (req) => {
  const { email } = req.body;
  const user = await findUserByEmail(email);

  // Always return success to prevent email enumeration
  if (!user) {
    return { message: 'If an account exists, a reset link has been sent' };
  }

  const resetToken = generateSecureToken();
  const tokenHash = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + config.security.passwordResetExpiresMinutes * 60 * 1000);

  await createPasswordResetToken(user.id, tokenHash, expiresAt);

  const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;

  await sendPasswordResetEmail(user.email, resetUrl, user.name);

  return { message: 'If an account exists, a reset link has been sent' };
};

/**
 * Reset password with token
 */
export const resetPassword = async (req) => {
  const { token, password } = req.body;

  const tokenHash = hashToken(token);
  const resetRecord = await findValidResetToken(tokenHash);

  if (!resetRecord) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const passwordHash = await hashPassword(password);
  await updateUserPassword(resetRecord.user_id, passwordHash);
  await markResetTokenUsed(resetRecord.id);

  // Revoke all sessions on password reset for security
  await revokeAllUserSessions(resetRecord.user_id);

  await createLoginLog({
    userId: resetRecord.user_id,
    email: resetRecord.email,
    loginMethod: 'password_reset',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    success: true,
  });

  return { message: 'Password reset successfully' };
};

/**
 * Get current user profile
 */
export const getProfile = async (req) => {
  const user = await findUserById(req.user.id);
  const recentLogins = await getRecentLoginLogsForUser(req.user.id);
  const sessions = await getUserSessions(req.user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      faceRegistered: !!user.face_descriptor,
      faceRegisteredAt: user.face_registered_at,
      createdAt: user.created_at,
    },
    recentLogins,
    sessions: sessions.filter((s) => !s.revoked_at && new Date(s.expires_at) > new Date()),
  };
};

/**
 * Revoke a specific session (multi-device management)
 */
export const revokeUserSession = async (req) => {
  const { sessionId } = req.params;
  const revoked = await revokeSession(sessionId, req.user.id);

  if (!revoked) {
    throw new AppError('Session not found', 404);
  }

  return { message: 'Session revoked successfully' };
};

/**
 * Admin: Get dashboard stats
 */
export const getAdminStats = async () => {
  return getUserStats();
};

/**
 * Admin: Get all users
 */
export const getAdminUsers = async (req) => {
  const limit = parseInt(req.query.limit || '50', 10);
  const offset = parseInt(req.query.offset || '0', 10);
  return getAllUsers(limit, offset);
};

/**
 * Admin: Get login logs
 */
export const getAdminLoginLogs = async (req) => {
  const limit = parseInt(req.query.limit || '50', 10);
  const offset = parseInt(req.query.offset || '0', 10);
  return getLoginLogs(limit, offset);
};

export default {
  register,
  login,
  refreshAccessToken,
  logout,
  registerFace,
  faceLogin,
  forgotPassword,
  resetPassword,
  getProfile,
  revokeUserSession,
  getAdminStats,
  getAdminUsers,
  getAdminLoginLogs,
};
