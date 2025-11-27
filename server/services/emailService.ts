import { transporter, EMAIL_CONFIG } from '../config/email';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`✉️  Email sent to ${options.to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

export const sendVerificationEmail = async (email: string, token: string, firstName?: string): Promise<void> => {
  const verificationLink = `${EMAIL_CONFIG.frontendUrl}/verify-email/${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to PixelVault! 🎉</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName || 'there'},</p>
          <p>Thanks for signing up for PixelVault! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center;">
            <a href="${verificationLink}" class="button">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <p>Best regards,<br>The PixelVault Team</p>
        </div>
        <div class="footer">
          <p>© 2024 PixelVault. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to PixelVault - Verify Your Email',
    html,
  });
};

export const sendPasswordResetEmail = async (email: string, token: string, firstName?: string): Promise<void> => {
  const resetLink = `${EMAIL_CONFIG.frontendUrl}/reset-password/${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName || 'there'},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetLink}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p>Best regards,<br>The PixelVault Team</p>
        </div>
        <div class="footer">
          <p>© 2024 PixelVault. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your PixelVault Password',
    html,
  });
};

export const sendFolderSharedEmail = async (
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  folderName: string,
  permission: string,
  folderLink: string
): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📁 Folder Shared With You</h1>
        </div>
        <div class="content">
          <p>Hi ${recipientName},</p>
          <p><strong>${senderName}</strong> has shared a folder with you on PixelVault.</p>
          <div class="info-box">
            <p><strong>Folder:</strong> ${folderName}</p>
            <p><strong>Permission Level:</strong> ${permission.charAt(0).toUpperCase() + permission.slice(1)}</p>
          </div>
          <div style="text-align: center;">
            <a href="${folderLink}" class="button">View Folder</a>
          </div>
          <p>Best regards,<br>The PixelVault Team</p>
        </div>
        <div class="footer">
          <p>© 2024 PixelVault. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: recipientEmail,
    subject: `${senderName} shared "${folderName}" with you`,
    html,
  });
};

export const sendCommentMentionEmail = async (
  recipientEmail: string,
  recipientName: string,
  commenterName: string,
  fileName: string,
  commentText: string,
  fileLink: string
): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .comment-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; font-style: italic; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💬 You Were Mentioned</h1>
        </div>
        <div class="content">
          <p>Hi ${recipientName},</p>
          <p><strong>${commenterName}</strong> mentioned you in a comment on "${fileName}":</p>
          <div class="comment-box">
            "${commentText}"
          </div>
          <div style="text-align: center;">
            <a href="${fileLink}" class="button">View Comment</a>
          </div>
          <p>Best regards,<br>The PixelVault Team</p>
        </div>
        <div class="footer">
          <p>© 2024 PixelVault. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: recipientEmail,
    subject: `${commenterName} mentioned you in a comment`,
    html,
  });
};

export const sendInvitationEmail = async (
  email: string,
  inviterName: string,
  folderName: string,
  permission: string
): Promise<void> => {
  const signupLink = `${EMAIL_CONFIG.frontendUrl}/signup?email=${encodeURIComponent(email)}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👋 You've Been Invited!</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p><strong>${inviterName}</strong> has invited you to collaborate on the folder <strong>"${folderName}"</strong> on PixelVault.</p>
          <div class="info-box">
             <p><strong>Permission Level:</strong> ${permission.charAt(0).toUpperCase() + permission.slice(1)}</p>
          </div>
          <p>Create an account to access this folder and start collaborating.</p>
          <div style="text-align: center;">
            <a href="${signupLink}" class="button">Accept Invitation</a>
          </div>
          <p>Best regards,<br>The PixelVault Team</p>
        </div>
        <div class="footer">
          <p>© 2024 PixelVault. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `${inviterName} invited you to collaborate on PixelVault`,
    html,
  });
};
