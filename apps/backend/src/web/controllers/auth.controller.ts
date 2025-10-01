// File: apps/backend/src/web/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from "crypto";
import nodemailer from 'nodemailer';
import { User } from '../models/user.model';
import { signToken } from '../utils/jwt';
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
        const { fullName, email, password, role } = req.body; // <-- Expect role
        if (!['host', 'student'].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified." });
        }
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already exists' });
        
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = new User({ fullName, email, password: passwordHash, role });
        await newUser.save();

        res.status(201).json({ message: 'User created successfully' });
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
        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(404).json({ message: 'Email not found' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
        
        const token = signToken({ id: user._id, role: user.role });
        res.json({ 
            token, 
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
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
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
