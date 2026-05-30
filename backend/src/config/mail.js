import nodemailer from 'nodemailer';
import config from './index.js';

let transporter = null;

/**
 * Create reusable SMTP transporter
 */
export const getMailTransporter = () => {
  if (transporter) return transporter;

  if (!config.smtp.host || !config.smtp.user) {
    console.warn('SMTP not configured. Email features will be disabled.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  return transporter;
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (to, resetUrl, userName) => {
  const mailer = getMailTransporter();

  if (!mailer) {
    console.log(`[DEV] Password reset link for ${to}: ${resetUrl}`);
    return { success: true, dev: true };
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">Password Reset Request</h2>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
        <p>This link expires in ${config.security.passwordResetExpiresMinutes} minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">FaceScane Auth - Secure Authentication</p>
      </div>
    </body>
    </html>
  `;

  await mailer.sendMail({
    from: config.smtp.from,
    to,
    subject: 'Reset Your Password - FaceScane Auth',
    html,
    text: `Hi ${userName}, reset your password here: ${resetUrl}. Link expires in ${config.security.passwordResetExpiresMinutes} minutes.`,
  });

  return { success: true };
};

export default getMailTransporter;
