import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import config from '../config/index.js';

/**
 * Hash password with bcrypt
 */
export const hashPassword = async (password) => {
  return bcrypt.hash(password, config.security.bcryptRounds);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate secure random token
 */
export const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash token for database storage
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Calculate Euclidean distance between two face descriptors
 */
export const euclideanDistance = (descriptor1, descriptor2) => {
  if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
    return Infinity;
  }

  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

/**
 * Check if face descriptors match within threshold
 */
export const facesMatch = (descriptor1, descriptor2, threshold = config.security.faceMatchThreshold) => {
  const distance = euclideanDistance(descriptor1, descriptor2);
  return { match: distance < threshold, distance };
};

/**
 * Parse user agent for device info
 */
export const parseUserAgent = (userAgent = '') => {
  let deviceType = 'desktop';
  let deviceName = 'Unknown Device';

  if (/mobile/i.test(userAgent)) deviceType = 'mobile';
  else if (/tablet/i.test(userAgent)) deviceType = 'tablet';

  if (/Windows/i.test(userAgent)) deviceName = 'Windows PC';
  else if (/Mac/i.test(userAgent)) deviceName = 'Mac';
  else if (/Linux/i.test(userAgent)) deviceName = 'Linux';
  else if (/Android/i.test(userAgent)) deviceName = 'Android';
  else if (/iPhone|iPad/i.test(userAgent)) deviceName = 'Apple Device';

  if (/Chrome/i.test(userAgent)) deviceName += ' - Chrome';
  else if (/Firefox/i.test(userAgent)) deviceName += ' - Firefox';
  else if (/Safari/i.test(userAgent)) deviceName += ' - Safari';
  else if (/Edge/i.test(userAgent)) deviceName += ' - Edge';

  return { deviceType, deviceName };
};

export default {
  hashPassword,
  comparePassword,
  generateSecureToken,
  hashToken,
  euclideanDistance,
  facesMatch,
  parseUserAgent,
};
