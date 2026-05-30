import { query } from '../config/database.js';

export const createLoginLog = async ({
  userId = null,
  email = null,
  loginMethod,
  ipAddress,
  userAgent,
  success,
  failureReason = null,
  metadata = null,
}) => {
  await query(
    `INSERT INTO login_logs (user_id, email, login_method, ip_address, user_agent, success, failure_reason, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [userId, email, loginMethod, ipAddress, userAgent, success, failureReason, metadata ? JSON.stringify(metadata) : null]
  );
};

export const getLoginLogs = async (limit = 50, offset = 0, userId = null) => {
  let text = `
    SELECT l.id, l.user_id, l.email, l.login_method, l.ip_address, l.success, l.failure_reason, l.created_at,
           u.name AS user_name
    FROM login_logs l
    LEFT JOIN users u ON u.id = l.user_id
  `;
  const params = [];

  if (userId) {
    text += ' WHERE l.user_id = $1';
    params.push(userId);
  }

  text += ` ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await query(text, params);
  return result.rows;
};

export const getRecentLoginLogsForUser = async (userId, limit = 10) => {
  const result = await query(
    `SELECT login_method, ip_address, success, failure_reason, created_at
     FROM login_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
};

export default {
  createLoginLog,
  getLoginLogs,
  getRecentLoginLogsForUser,
};
