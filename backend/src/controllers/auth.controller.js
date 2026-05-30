import * as authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import config from '../config/index.js';
import { parseExpiryToMs } from '../utils/jwt.js';

/**
 * Set refresh token as httpOnly cookie
 */
const setRefreshTokenCookie = (res, refreshToken, rememberMe = false) => {
  const expiresIn = rememberMe ? config.jwt.rememberMeExpiresIn : config.jwt.refreshExpiresIn;
  const maxAge = parseExpiryToMs(expiresIn);

  res.cookie(config.cookies.refreshTokenName, refreshToken, {
    httpOnly: config.cookies.httpOnly,
    secure: config.cookies.secure,
    sameSite: config.cookies.sameSite,
    maxAge,
    path: '/api/auth',
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(config.cookies.refreshTokenName, {
    httpOnly: config.cookies.httpOnly,
    secure: config.cookies.secure,
    sameSite: config.cookies.sameSite,
    path: '/api/auth',
  });
};

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req);
    return successResponse(res, result, 'Registration successful', 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req);
    setRefreshTokenCookie(res, result.refreshToken, req.body.rememberMe);
    return successResponse(res, {
      user: result.user,
      accessToken: result.accessToken,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const result = await authService.refreshAccessToken(req);
    return successResponse(res, result, 'Token refreshed');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const result = await authService.logout(req);
    clearRefreshTokenCookie(res);
    return successResponse(res, result, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const registerFace = async (req, res, next) => {
  try {
    const result = await authService.registerFace(req);
    return successResponse(res, result, 'Face registered successfully');
  } catch (error) {
    next(error);
  }
};

export const faceLogin = async (req, res, next) => {
  try {
    const result = await authService.faceLogin(req);
    setRefreshTokenCookie(res, result.refreshToken);
    return successResponse(res, {
      user: result.user,
      accessToken: result.accessToken,
      matchAccuracy: result.matchAccuracy,
    }, 'Face login successful');
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req);
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req);
    return successResponse(res, result, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const result = await authService.getProfile(req);
    return successResponse(res, result, 'Profile retrieved');
  } catch (error) {
    next(error);
  }
};

export const revokeSession = async (req, res, next) => {
  try {
    const result = await authService.revokeUserSession(req);
    return successResponse(res, result, 'Session revoked');
  } catch (error) {
    next(error);
  }
};

export const getAdminStats = async (req, res, next) => {
  try {
    const result = await authService.getAdminStats();
    return successResponse(res, result, 'Stats retrieved');
  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (req, res, next) => {
  try {
    const result = await authService.getAdminUsers(req);
    return successResponse(res, result, 'Users retrieved');
  } catch (error) {
    next(error);
  }
};

export const getAdminLoginLogs = async (req, res, next) => {
  try {
    const result = await authService.getAdminLoginLogs(req);
    return successResponse(res, result, 'Login logs retrieved');
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  refreshToken,
  logout,
  registerFace,
  faceLogin,
  forgotPassword,
  resetPassword,
  getProfile,
  revokeSession,
  getAdminStats,
  getAdminUsers,
  getAdminLoginLogs,
};
