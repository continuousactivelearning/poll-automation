// apps/backend/src/web/controllers/authController.ts
import { Request, Response } from 'express';
import User, { IUser } from '../models/User'; // Ensure User model is imported
import jwt from 'jsonwebtoken'; // Import jwt
import dotenv from 'dotenv';
import { Types } from 'mongoose';
import sendEmail from '../../utils/sendEmail';
import crypto from 'crypto';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('Error: JWT_SECRET is not defined in environment variables.');
  process.exit(1);
}

export const registerUser = async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Please enter all required fields (Full Name, Email, and Password).' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with that email already exists.' });
    }

    user = await User.create({
      fullName,
      email,
      password,
    });

    const newUser: IUser = user as IUser;

    // Generate token using the method from the User instance
    const token = newUser.getSignedJwtToken();

    const subject = 'Welcome to Automatic Poll Generation!';
    const text = `Dear ${newUser.fullName},\n\nWelcome to Automatic Poll Generation! We're excited to have you on board.\n\nStart creating and participating in polls right away. If you have any questions, feel free to reach out to our support.\n\nBest regards,\nThe Automatic Poll Generation Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #4CAF50;">Welcome to Automatic Poll Generation!</h2>
        <p>Dear <strong>${newUser.fullName}</strong>,</p>
        <p>We're thrilled to welcome you to our platform! You can now effortlessly create, manage, and participate in polls.</p>
        <p>Here are some things you can do:</p>
        <ul>
          <li>Create new polls manually or with AI assistance.</li>
          <li>Share polls with your audience.</li>
          <li>Participate in polls as a student.</li>
          <li>Track results and view leaderboards.</li>
        </ul>
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p>Happy Polling!</p>
        <p style="font-size: 0.9em; color: #777;">Best regards,<br>The Automatic Poll Generation Team</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.8em; color: #999;">This is an automated email, please do not reply.</p>
      </div>
    `;

    sendEmail(newUser.email, subject, text, html)
      .then(success => {
        if (success) {
          console.log(`Welcome email sent to ${newUser.email}`);
        } else {
          console.error(`Failed to send welcome email to ${newUser.email}`);
        }
      })
      .catch(emailError => {
        console.error(`Error sending welcome email to ${newUser.email}:`, emailError);
      });

    res.status(201).json({
      message: 'User registered successfully! A welcome email has been sent.',
      user: {
        id: newUser._id.toString(),
        fullName: newUser.fullName,
        email: newUser.email,
      },
      token: token, // Send the generated token
    });
  } catch (error: any) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields (email and password).' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const loggedInUser: IUser = user as IUser;

    // Generate token using the method from the User instance
    const token = loggedInUser.getSignedJwtToken();

    res.status(200).json({
      message: 'Logged in successfully!',
      user: {
        id: loggedInUser._id.toString(),
        fullName: loggedInUser.fullName,
        email: loggedInUser.email,
      },
      token: token, // Send the generated token
    });
  } catch (error: any) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
};

/**
 * @desc    Request password reset link (send email with token)
 * @route   POST /api/auth/forgotpassword
 * @access  Public
 * @param   req Express Request object (expects email in body)
 * @param   res Express Response object
 */
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please provide an email address.' });
  }

  try {
    const userDoc = await User.findOne({ email });

    if (!userDoc) {
      // MODIFIED: Return a 404 with a specific message if user not found
      return res.status(404).json({ message: 'No account found with that email address.' });
    }

    const user: IUser = userDoc as IUser;

    const resetToken = user.getResetPasswordToken();

    await user.save(); // Save the user to persist resetPasswordToken and resetPasswordExpire

    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    const subject = 'Password Reset Request for Automatic Poll Generation';
    const text = `Dear ${user.fullName},\n\nYou are receiving this email because you (or someone else) has requested the reset of a password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}\n\nThis link will expire in 10 minutes.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n\nBest regards,\nThe Automatic Poll Generation Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #FFC107;">Password Reset Request</h2>
        <p>Dear <strong>${user.fullName}</strong>,</p>
        <p>You are receiving this email because you (or someone else) has requested the reset of a password for your account.</p>
        <p>Please click on the button below to reset your password:</p>
        <p style="text-align: center;">
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Your Password</a>
        </p>
        <p>This link will expire in <strong>10 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <p style="font-size: 0.9em; color: #777;">Best regards,<br>The Automatic Poll Generation Team</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.8em; color: #999;">This is an automated email, please do not reply.</p>
      </div>
    `;

    sendEmail(user.email, subject, text, html)
      .then(success => {
        if (success) {
          console.log(`Password reset email sent to ${user.email}`);
        } else {
          console.error(`Failed to send password reset email to ${user.email}`);
        }
      })
      .catch(emailError => {
        console.error(`Error sending password reset email to ${user.email}:`, emailError);
      });

    res.status(200).json({ message: 'Password reset link sent successfully!' }); // MODIFIED: Specific success message
  } catch (error: any) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ message: 'Server error during password reset request.', error: error.message });
  }
};

/**
 * @desc    Reset user password using token
 * @route   PUT /api/auth/resetpassword/:resettoken
 * @access  Public
 * @param   req Express Request object (expects resettoken in params, newPassword in body)
 * @param   res Express Response object
 */
export const resetPassword = async (req: Request, res: Response) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: 'Please provide a new password.' });
  }

  try {
    const userDoc = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!userDoc) {
      return res.status(400).json({ message: 'Invalid or expired password reset token.' });
    }

    const user: IUser = userDoc as IUser; // Cast the found document to IUser

    // IMPORTANT FIX: Use user.set() to ensure Mongoose detects the password change
    // and triggers the pre('save') hashing hook.
    user.set('password', newPassword);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save(); // This save operation will now trigger the password hashing

    res.status(200).json({ message: 'Password has been reset successfully!' });

  } catch (error: any) {
    console.error('Error in reset password:', error);
    res.status(500).json({ message: 'Server error during password reset.', error: error.message });
  }
};
