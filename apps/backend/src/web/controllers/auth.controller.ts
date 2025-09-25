import { Request, Response } from 'express';
import { User } from '../models/user.model';
import bcrypt from 'bcryptjs';
import { signToken } from '../utils/jwt';
import crypto from 'crypto';
import { sendResetEmail } from '../utils/email';
import { sendEmail } from '../utils/email';

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export const register = async (req: Request, res: Response) => {
  try {
    const {  email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      throw new ValidationError('Email already exists');
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      fullName: req.body.fullName,
      email: req.body.email,
      password: hashed,
      role: 'student',
    });
    await user.save();

    // Generate token for the new user
    const token = signToken({ id: user._id, role: user.role });

    // Try to send welcome email, but don't fail registration if email fails
    try {
      const subject = 'Welcome to PollGen!';
      const html = `<p>Dear ${user.fullName},</p>
                    <p>Welcome to <b>PollGen</b>! Your account has been created successfully.</p>
                    <p>You can now join or create polls, participate in sessions, and track your progress.</p>
                    <p>We’re excited to have you on board!</p>
                    <p>Best regards,<br/>Poll Generation Team</p>`;
      await sendEmail(user.email, subject, html);
      console.log('✅ Welcome email sent successfully');
    } catch (emailError) {
      console.log(
        '⚠️ Failed to send welcome email (non-critical):',
        emailError
      );
      // Don't throw the error - registration should still succeed
    }

    // Return token and user data like login does
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
    } else {
      console.error('Full error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type',
      });
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new ValidationError('Email not found');
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new AuthenticationError('Invalid password');
    }
    const token = signToken({ id: user._id, role: user.role });
    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email,
        role: user.role,
        bio: user.bio,
      },
    });
  } catch (error) {
    if (
      error instanceof ValidationError ||
      error instanceof AuthenticationError
    ) {
      res.status(400).json({ message: error.message });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new ValidationError('Email not found');
    }
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordReset = {
      token,
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      used: false,
    };
    await user.save();
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await sendResetEmail(email, resetLink);
    res.status(200).json({
      message:
        "If an account with that email exists, you'll receive a password reset link shortly.",
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ 'passwordReset.token': token });
    if (!user) {
      throw new ValidationError('Invalid or expired token');
    }
    if (user.passwordReset && user.passwordReset.used) {
      throw new ValidationError('Password reset link has already been used');
    }
    user.password = await bcrypt.hash(password, 10);
    if (user.passwordReset) {
      user.passwordReset.used = true;
      user.passwordReset.token = undefined;
      user.passwordReset.expires = undefined;
    }
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};
