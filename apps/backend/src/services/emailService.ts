import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.createTransporter();
  }

  private createTransporter() {
    // For development, use Ethereal Email (fake SMTP service)
    // In production, use a real email service like SendGrid, Mailgun, etc.

    if (process.env.NODE_ENV === 'production') {
      // Production email configuration
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    } else {
      // Development configuration - use Ethereal Email
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      });
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, resetURL: string): Promise<void> {
    const mailOptions: EmailOptions = {
      to: email,
      subject: '🔐 Password Reset Request - Poll Automation',
      html: this.getPasswordResetEmailTemplate(resetToken, resetURL),
      text: `
        Password Reset Request
        
        You requested a password reset for your Poll Automation account.
        
        Click the link below to reset your password:
        ${resetURL}
        
        This link will expire in 10 minutes.
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        Poll Automation Team
      `
    };

    try {
      const info = await this.transporter.sendMail({
        from: `"Poll Automation" <${process.env.EMAIL_FROM || 'noreply@pollautomation.com'}>`,
        ...mailOptions
      });

      console.log('📧 Password reset email sent successfully');
      console.log('Message ID:', info.messageId);
      
      // For development with Ethereal Email, log the preview URL
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  private getPasswordResetEmailTemplate(resetToken: string, resetURL: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Poll Automation</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #4F46E5;
            margin-bottom: 10px;
          }
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .reset-button:hover {
            background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
          }
          .warning {
            background-color: #FEF3C7;
            border: 1px solid #F59E0B;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎤 Poll Automation</div>
            <h1>Password Reset Request</h1>
          </div>
          
          <p>Hello,</p>
          
          <p>You requested a password reset for your Poll Automation account. Click the button below to reset your password:</p>
          
          <div style="text-align: center;">
            <a href="${resetURL}" class="reset-button">Reset My Password</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul>
              <li>This link will expire in <strong>10 minutes</strong></li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>For security, never share this link with anyone</li>
            </ul>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">
            ${resetURL}
          </p>
          
          <div class="footer">
            <p>Best regards,<br>The Poll Automation Team</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendWelcomeEmail(email: string, displayName: string): Promise<void> {
    const mailOptions: EmailOptions = {
      to: email,
      subject: '🎉 Welcome to Poll Automation!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">🎤 Welcome to Poll Automation!</h1>
          <p>Hi ${displayName},</p>
          <p>Welcome to Poll Automation! Your account has been created successfully.</p>
          <p>You can now start creating interactive polls from voice recordings using our AI-powered platform.</p>
          <p>Best regards,<br>The Poll Automation Team</p>
        </div>
      `,
      text: `Welcome to Poll Automation! Hi ${displayName}, your account has been created successfully.`
    };

    try {
      await this.transporter.sendMail({
        from: `"Poll Automation" <${process.env.EMAIL_FROM || 'noreply@pollautomation.com'}>`,
        ...mailOptions
      });
      console.log('📧 Welcome email sent successfully');
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      // Don't throw error for welcome email failure
    }
  }
}

export default new EmailService();
