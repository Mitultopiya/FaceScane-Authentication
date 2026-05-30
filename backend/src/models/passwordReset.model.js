import { query } from '../config/database.js';

export const createPasswordResetToken = async (userId, tokenHash, expiresAt) => {
  // Invalidate existing tokens for this user
  await query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
    [userId]
  );

  const result = await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, expires_at`,
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0];
};

export const findValidResetToken = async (tokenHash) => {
  const result = await query(
    `SELECT prt.*, u.email, u.name
     FROM password_reset_tokens prt
     JOIN users u ON u.id = prt.user_id
     WHERE prt.token_hash = $1 AND prt.used_at IS NULL AND prt.expires_at > NOW()`,
    [tokenHash]
  );
  return result.rows[0] || null;
};

export const markResetTokenUsed = async (tokenId) => {
  await query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [tokenId]);
};

export default {
  createPasswordResetToken,
  findValidResetToken,
  markResetTokenUsed,
};
