import nodemailer from "nodemailer";

export const sendEmail = async (to: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `Poll Generation Team <${process.env.SENDER_EMAIL || process.env.EMAIL_USER}>`, // <-- update here
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};
export const sendResetEmail = async (to: string, resetLink: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `Poll Generation Team <${process.env.SENDER_EMAIL || process.env.EMAIL_USER}>`, // <-- update here
    to,
    subject: "Password Reset Request",
    html: `<p>Hello,</p>
           <p>We received a request to reset your password for your PollGen account.</p>
           <p>Click the link below to set a new password. This link is valid for 1 hour:</p>
           <p><a href="${resetLink}">${resetLink}</a></p>
           <p>If you did not request this, you can safely ignore this email.</p>
           <p>Best regards,<br/>Poll Generation Team</p>`
  });
};