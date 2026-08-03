import nodemailer from 'nodemailer';
import logger from './logger.js';

let transporter;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const isGmail = host.includes('gmail');
    
    const user = process.env.EMAIL_USER.trim();
    const pass = process.env.EMAIL_PASS.replace(/\s+/g, '');

    transporter = nodemailer.createTransport(
      isGmail
        ? {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // SSL
            auth: { user, pass },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
          }
        : {
            host: host,
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: false,
            auth: { user, pass },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
          }
    );
  }
} catch (error) {
  console.warn('Email not configured, email features will be disabled', error);
}

export const sendVerificationEmail = async (email, token) => {
  if (!transporter) {
    logger.warn('Email not configured, skipping verification email. Token:', token);
    return;
  }
  
  const verificationUrl = `${process.env.CLIENT_ORIGIN}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email - Premium Recipe Generator',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Premium Recipe Generator!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Verify Email
        </a>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent to ${email}`);
  } catch (error) {
    logger.error('Error sending verification email', error);
    throw error;
  }
};

export const sendReceiptEmail = async (email, subscriptionDetails) => {
  if (!transporter) {
    logger.warn('Email not configured, skipping receipt email');
    return;
  }
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Subscription Receipt - Premium Recipe Generator',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank you for your subscription!</h2>
        <p>Your ${subscriptionDetails.planId} plan is now active.</p>
        <p><strong>Plan:</strong> ${subscriptionDetails.planId}</p>
        <p><strong>Status:</strong> ${subscriptionDetails.status}</p>
        <p>You now have access to all premium features!</p>
      </div>
    `,
  };

export const sendResetPasswordEmail = async (email, token) => {
  if (!transporter) {
    logger.warn('Email not configured, skipping password reset email. Token:', token);
    return;
  }
  
  const resetUrl = `${process.env.CLIENT_ORIGIN}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Your Password - FlavourHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>You requested a password reset for your FlavourHub account. Click the button below to reset it:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);
  } catch (error) {
    logger.error('Error sending password reset email', error);
  }
};

