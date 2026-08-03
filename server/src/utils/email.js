import logger from './logger.js';

// Email sending is not available on this deployment.
// Reset links are logged to server logs for admin access.

export const logResetLink = (email, resetUrl) => {
  logger.info(`[ForgotPassword] Reset token generated for: ${email}`);
  logger.info(`[ForgotPassword] Reset Link: ${resetUrl}`);
};
