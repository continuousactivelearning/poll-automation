// File: apps/backend/src/web/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from "crypto";
import nodemailer from 'nodemailer';
import { User } from '../models/user.model';
import { signToken, signShortToken, signRefreshToken, refreshAccessToken } from '../utils/jwt';
import { sendResetEmail, sendEmail } from '../utils/email';
import { OAuth2Client } from 'google-auth-library';

// Helper to create Google OAuth2 client
function createGoogleClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI; // e.g. http://localhost:8000/api/auth/google/callback
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth environment variables are not configured');
  }
  // OAuth2Client expects (clientId, clientSecret, redirectUri)
  // See: https://github.com/googleapis/google-auth-library-nodejs
  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

// Constructs Google auth URL
export const getGoogleAuthUrl = async (req: Request, res: Response) => {
  try {
    const client = createGoogleClient();
    const redirect = req.query.redirect as string;
    
    // Use state parameter to pass redirect information through OAuth flow
    const state = redirect ? JSON.stringify({ redirect }) : undefined;
    
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'profile', 'email'],
      prompt: 'select_account',
      state: state
    });
  // Redirect browser directly to Google auth URL. This is more reliable for OAuth flows
  // when invoked from a browser (avoids fetch + CORS redirect complexity).
  return res.redirect(302, authUrl);
  } catch (error) {
    console.error('Google auth url error', error);
    res.status(500).json({ message: 'Failed to create Google auth URL' });
  }
};

// Handle Google callback - exchange code, verify and upsert user
export const handleGoogleCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    
    if (!code) return res.status(400).json({ message: 'Missing code' });

    // Parse state to get redirect information
    let redirectInfo = null;
    if (state) {
      try {
        redirectInfo = JSON.parse(state);
      } catch (e) {
        console.log('Failed to parse state parameter:', e);
      }
    }

    const client = createGoogleClient();
    const { tokens } = await client.getToken(code);
    // Verify id_token and extract user info
  if (!tokens.id_token) return res.status(400).json({ message: 'No id_token returned from Google' });

    const ticket = await client.verifyIdToken({ idToken: tokens.id_token });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(400).json({ message: 'Unable to verify Google user' });

    const email = payload.email;
    const fullName = payload.name || '';
    const avatar = payload.picture || '';

    // Determine user role based on redirect parameter
    let userRole: 'host' | 'student' = 'student'; // default
    if (redirectInfo?.redirect === 'create-poll') {
      userRole = 'host';
    } else if (redirectInfo?.redirect === 'join-poll') {
      userRole = 'student';
    }

    // Upsert user in DB
    let user = await User.findOne({ email });
    if (!user) {
      // Create new user with determined role
      user = new User({ fullName, email, avatar, role: userRole, googleId: payload.sub });
      await user.save();
    } else {
      // For existing users, update their role if they're coming through a specific flow
      // This allows users to switch roles if needed
      if (redirectInfo?.redirect) {
        user.role = userRole;
      }
      // Update basic profile fields if missing
      user.fullName = user.fullName || fullName;
      user.avatar = user.avatar || avatar;
      user.googleId = user.googleId || payload.sub;
      await user.save();
    }

    // Issue JWT for the frontend
    const token = signToken({ id: user._id, role: user.role });

    // If FRONTEND_URL is configured, redirect the browser with the token as a query param.
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl) {
      // Pass redirect info to frontend callback for proper routing
      const redirectParam = redirectInfo?.redirect ? `&redirect=${redirectInfo.redirect}` : '';
      const redirect = `${frontendUrl.replace(/\/$/, '')}/auth/google/callback?token=${encodeURIComponent(token)}${redirectParam}`;
      return res.redirect(302, redirect);
    }

    // Fallback: return JSON
    res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (error) {
    console.error('Google callback error', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
}; 

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
        // const user = await User.findOne({ email }).select('+password');
     const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(404).json({ message: 'Email not found' });
        
        // const isMatch = await bcrypt.compare(password, user.password);
        // if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
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

