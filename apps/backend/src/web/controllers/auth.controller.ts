// File: apps/backend/src/web/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from "crypto";
import nodemailer from 'nodemailer';
import { User } from '../models/user.model';
import { signToken, signShortToken, signRefreshToken, refreshAccessToken } from '../utils/jwt';
import { sendResetEmail, sendEmail } from '../utils/email';

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
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      throw new ValidationError('All fields are required');
    }

    if (!['host', 'student'].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ValidationError('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ fullName, email, password: hashedPassword, role: role || 'student' });
    
    await user.save();
    
    const token = signToken({ id: user._id, role: user.role });
    
    res.status(201).json({ 
      token, 
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role } 
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

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            throw new ValidationError('Email and password are required');
        }
        
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email not found' });
        
        // user.password may be undefined for OAuth-created accounts; handle gracefully
        const storedHash = user.password as string | undefined;
        if (!storedHash) return res.status(401).json({ message: 'Account exists but has no password. Please use Google sign-in.' });
        const isMatch = await bcrypt.compare(password, storedHash);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
        
        const token = signShortToken({ id: user._id, role: user.role }); // Shorter access token
        const refreshToken = signRefreshToken({ id: user._id, role: user.role }); // Longer refresh token
        
        res.json({ 
            token, 
            refreshToken,
            user: { id: user._id, fullName: user.fullName, email, role: user.role, avatar: user.avatar } 
        });
    } catch (error) {
        if (error instanceof ValidationError || error instanceof AuthenticationError) {
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
    const token = crypto.randomBytes(32).toString("hex");
    user.passwordReset = {
      token,
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      used: false
    };
    await user.save();
    const isProduction = process.env.NODE_ENV === 'production';
    const frontendUrl = isProduction 
      ? (process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL_PRODUCTION) 
      : process.env.FRONTEND_URL_LOCAL;
    const resetLink = `${frontendUrl}/reset-password/${token}`;
    await sendResetEmail(email, resetLink);
    res.status(200).json({ message: "If an account with that email exists, you'll receive a password reset link shortly." });
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
    const user = await User.findOne({ "passwordReset.token": token });
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
    res.json({ message: "Password reset successful" });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not provided' });
    }
    
    const newAccessToken = refreshAccessToken(refreshToken);
    
    res.json({ 
      token: newAccessToken,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};
