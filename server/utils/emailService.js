const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Test email connection
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service connected successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }

  // Send welcome email to new user
  async sendWelcomeEmail(userEmail, userData, tempPassword) {
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Expense Management System',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER
      },
      to: userEmail,
      subject: 'Welcome to Expense Management System - Your Account Details',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Expense Management System</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #4f46e5;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                .content {
                    background-color: #f9fafb;
                    padding: 30px;
                    border-radius: 0 0 8px 8px;
                    border: 1px solid #e5e7eb;
                }
                .credentials-box {
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    border: 1px solid #d1d5db;
                    margin: 20px 0;
                }
                .credential-item {
                    margin: 10px 0;
                    padding: 8px 0;
                    border-bottom: 1px solid #f3f4f6;
                }
                .credential-item:last-child {
                    border-bottom: none;
                }
                .label {
                    font-weight: bold;
                    color: #4f46e5;
                }
                .value {
                    color: #1f2937;
                    font-family: monospace;
                    background-color: #f3f4f6;
                    padding: 4px 8px;
                    border-radius: 4px;
                    display: inline-block;
                    margin-left: 10px;
                }
                .login-button {
                    background-color: #4f46e5;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    display: inline-block;
                    margin: 20px 0;
                }
                .warning {
                    background-color: #fef3c7;
                    border: 1px solid #f59e0b;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    color: #6b7280;
                    font-size: 14px;
                    margin-top: 30px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Welcome to Expense Management System</h1>
            </div>
            
            <div class="content">
                <h2>Hello ${userData.firstName} ${userData.lastName},</h2>
                
                <p>Welcome to our Expense Management System! Your account has been successfully created by an administrator.</p>
                
                <div class="credentials-box">
                    <h3>Your Login Credentials:</h3>
                    <div class="credential-item">
                        <span class="label">Email:</span>
                        <span class="value">${userEmail}</span>
                    </div>
                    <div class="credential-item">
                        <span class="label">Temporary Password:</span>
                        <span class="value">${tempPassword}</span>
                    </div>
                    <div class="credential-item">
                        <span class="label">Role:</span>
                        <span class="value">${userData.role}</span>
                    </div>
                    ${userData.employeeId ? `
                    <div class="credential-item">
                        <span class="label">Employee ID:</span>
                        <span class="value">${userData.employeeId}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important Security Notice:</strong><br>
                    For security reasons, please change your password immediately after your first login.
                </div>
                
                <div style="text-align: center;">
                    <a href="${process.env.CLIENT_URL}/login" class="login-button">Login to Your Account</a>
                </div>
                
                <h3>Getting Started:</h3>
                <ol>
                    <li>Click the login button above or visit <a href="${process.env.CLIENT_URL}">${process.env.CLIENT_URL}</a></li>
                    <li>Use your email and temporary password to log in</li>
                    <li>Update your password in the Profile section</li>
                    <li>Complete your profile information</li>
                    <li>Start managing your expenses!</li>
                </ol>
                
                <p>If you have any questions or need assistance, please contact your system administrator.</p>
            </div>
            
            <div class="footer">
                <p>This email was sent automatically by the Expense Management System.<br>
                Please do not reply to this email.</p>
            </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail, resetToken, userName) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Expense Management System',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER
      },
      to: userEmail,
      subject: 'Password Reset Request - Expense Management System',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset Request</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #dc2626;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                .content {
                    background-color: #f9fafb;
                    padding: 30px;
                    border-radius: 0 0 8px 8px;
                    border: 1px solid #e5e7eb;
                }
                .reset-button {
                    background-color: #dc2626;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    display: inline-block;
                    margin: 20px 0;
                }
                .warning {
                    background-color: #fef2f2;
                    border: 1px solid #dc2626;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    color: #6b7280;
                    font-size: 14px;
                    margin-top: 30px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            
            <div class="content">
                <h2>Hello ${userName},</h2>
                
                <p>We received a request to reset your password for your Expense Management System account.</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="reset-button">Reset Your Password</a>
                </div>
                
                <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
                <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
                    ${resetUrl}
                </p>
                
                <div class="warning">
                    <strong>⚠️ Security Notice:</strong><br>
                    This password reset link will expire in 1 hour for security reasons.<br>
                    If you didn't request this password reset, please ignore this email and your password will remain unchanged.
                </div>
                
                <p>If you continue to have problems, please contact your system administrator.</p>
            </div>
            
            <div class="footer">
                <p>This email was sent automatically by the Expense Management System.<br>
                Please do not reply to this email.</p>
            </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();