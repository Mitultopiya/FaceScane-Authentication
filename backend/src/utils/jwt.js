import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Generate JWT access token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (payload, rememberMe = false) => {
  const expiresIn = rememberMe ? config.jwt.rememberMeExpiresIn : config.jwt.refreshExpiresIn;
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn });
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

/**
 * Parse expiry string to milliseconds
 */
export const parseExpiryToMs = (expiry) => {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (multipliers[unit] || 86400000);
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  parseExpiryToMs,
};
