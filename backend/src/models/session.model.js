import { query } from '../config/database.js';

export const createSession = async ({
  userId,
  refreshTokenHash,
  deviceName,
  deviceType,
  ipAddress,
  userAgent,
  isRememberMe,
  expiresAt,
}) => {
  const result = await query(
    `INSERT INTO sessions (user_id, refresh_token_hash, device_name, device_type, ip_address, user_agent, is_remember_me, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, device_name, device_type, ip_address, is_remember_me, expires_at, created_at`,
    [userId, refreshTokenHash, deviceName, deviceType, ipAddress, userAgent, isRememberMe, expiresAt]
  );
  return result.rows[0];
};

export const findSessionByRefreshToken = async (tokenHash) => {
  const result = await query(
    `SELECT s.*, u.email, u.name, u.role, u.is_active
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.refresh_token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > NOW()`,
    [tokenHash]
  );
  return result.rows[0] || null;
};

export const updateSessionActivity = async (sessionId) => {
  await query('UPDATE sessions SET last_active_at = NOW() WHERE id = $1', [sessionId]);
};

export const revokeSession = async (sessionId, userId) => {
  const result = await query(
    'UPDATE sessions SET revoked_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id',
    [sessionId, userId]
  );
  return result.rows[0] || null;
};

export const revokeAllUserSessions = async (userId, exceptSessionId = null) => {
  if (exceptSessionId) {
    await query(
      'UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND id != $2 AND revoked_at IS NULL',
      [userId, exceptSessionId]
    );
  } else {
    await query(
      'UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]
    );
  }
};

export const getUserSessions = async (userId) => {
  const result = await query(
    `SELECT id, device_name, device_type, ip_address, is_remember_me, last_active_at, expires_at, created_at, revoked_at
     FROM sessions WHERE user_id = $1 ORDER BY last_active_at DESC`,
    [userId]
  );
  return result.rows;
};

export default {
  createSession,
  findSessionByRefreshToken,
  updateSessionActivity,
  revokeSession,
  revokeAllUserSessions,
  getUserSessions,
};
