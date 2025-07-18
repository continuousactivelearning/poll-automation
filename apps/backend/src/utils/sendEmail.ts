// apps/backend/src/utils/sendEmail.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Sends an email using the configured Nodemailer transporter.
 * @param to The recipient's email address.
 * @param subject The subject line of the email.
 * @param text The plain-text body of the email.
 * @param html The HTML body of the email (optional, overrides text if both are provided).
 */
const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    // Define email options
    const mailOptions = {
      // Changed the 'from' field to include a name.
      // The format is "Your Name <your_email@example.com>"
      from: `"Automatic Poll Generation" <${process.env.EMAIL_USER}>`, // Sender address with custom name
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error: any) {
    console.error('Error sending email:', error);
    console.error('Email sending error details:', error.message);
    return false;
  }
};

export default sendEmail;
