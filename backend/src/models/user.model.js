import { query } from '../config/database.js';

export const findUserByEmail = async (email) => {
  const result = await query(
    'SELECT id, name, email, password_hash, role, face_descriptor, face_registered_at, is_active, email_verified, created_at FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  return result.rows[0] || null;
};

export const findUserById = async (id) => {
  const result = await query(
    'SELECT id, name, email, role, face_descriptor, face_registered_at, is_active, email_verified, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

export const createUser = async ({ name, email, passwordHash, role = 'user' }) => {
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name.trim(), email.toLowerCase().trim(), passwordHash, role]
  );
  return result.rows[0];
};

export const updateUserPassword = async (userId, passwordHash) => {
  await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [passwordHash, userId]
  );
};

export const updateFaceDescriptor = async (userId, descriptor) => {
  const result = await query(
    `UPDATE users SET face_descriptor = $1, face_registered_at = NOW(), updated_at = NOW()
     WHERE id = $2
     RETURNING id, name, email, face_registered_at`,
    [JSON.stringify(descriptor), userId]
  );
  return result.rows[0];
};

export const getAllUsers = async (limit = 50, offset = 0) => {
  const result = await query(
    `SELECT id, name, email, role, face_registered_at, is_active, created_at
     FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const countResult = await query('SELECT COUNT(*) FROM users');
  return {
    users: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};

export const getUserStats = async () => {
  const result = await query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COUNT(*) FROM users WHERE face_descriptor IS NOT NULL) AS face_registered,
      (SELECT COUNT(*) FROM login_logs WHERE success = true AND created_at > NOW() - INTERVAL '24 hours') AS logins_24h,
      (SELECT COUNT(*) FROM sessions WHERE revoked_at IS NULL AND expires_at > NOW()) AS active_sessions
  `);
  return result.rows[0];
};

export default {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserPassword,
  updateFaceDescriptor,
  getAllUsers,
  getUserStats,
};
