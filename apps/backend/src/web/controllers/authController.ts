// apps/backend/src/web/controllers/authController.ts
import { Request, Response } from "express";
import User, { IUser } from "../models/User";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import sendEmail from "../../utils/sendEmail";
import crypto from "crypto";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error("Error: JWT_SECRET is not defined in environment variables.");
  process.exit(1);
}

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    res.status(400).json({ message: "Please enter all required fields (Full Name, Email, and Password)." });
    return;
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      res.status(400).json({ message: "User with that email already exists." });
      return;
    }

    user = await User.create({
      fullName,
      email,
      password,
    });

    const newUser: IUser = user as IUser;
    const token = newUser.getSignedJwtToken();

    const subject = "Welcome to Automatic Poll Generation!";
    const text = `Dear ${newUser.fullName},\n\nWelcome to Automatic Poll Generation!...`;
    const html = `<div> ... your email HTML content ... </div>`;

    sendEmail(newUser.email, subject, text, html).catch(err =>
      console.error(`Error sending welcome email:`, err)
    );

    res.status(201).json({
      message: "User registered successfully! A welcome email has been sent.",
      user: {
        id: newUser._id.toString(),
        fullName: newUser.fullName,
        email: newUser.email,
      },
      token,
    });
  } catch (error: any) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Server error during registration.", error: error.message });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Please enter all fields (email and password)." });
    return;
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "Invalid credentials." });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid credentials." });
      return;
    }

    const loggedInUser: IUser = user as IUser;
    const token = loggedInUser.getSignedJwtToken();

    res.status(200).json({
      message: "Logged in successfully!",
      user: {
        id: loggedInUser._id.toString(),
        fullName: loggedInUser.fullName,
        email: loggedInUser.email,
      },
      token,
    });
  } catch (error: any) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Server error during login.", error: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: "Please provide an email address." });
    return;
  }

  try {
    const userDoc = await User.findOne({ email });
    if (!userDoc) {
      res.status(404).json({ message: "No account found with that email address." });
      return;
    }

    const user: IUser = userDoc as IUser;
    const resetToken = user.getResetPasswordToken();
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
    const subject = "Password Reset Request for Automatic Poll Generation";
    const text = `Dear ${user.fullName},\n\nYou requested a password reset...\n${resetUrl}`;
    const html = `<div> ... your reset email HTML content ... </div>`;

    sendEmail(user.email, subject, text, html).catch(err =>
      console.error(`Error sending password reset email:`, err)
    );

    res.status(200).json({ message: "Password reset link sent successfully!" });
  } catch (error: any) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ message: "Server error during password reset request.", error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const { newPassword } = req.body;

  if (!newPassword) {
    res.status(400).json({ message: "Please provide a new password." });
    return;
  }

  try {
    const userDoc = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!userDoc) {
      res.status(400).json({ message: "Invalid or expired password reset token." });
      return;
    }

    const user: IUser = userDoc as IUser;
    user.set("password", newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: "Password has been reset successfully!" });
  } catch (error: any) {
    console.error("Error in reset password:", error);
    res.status(500).json({ message: "Server error during password reset.", error: error.message });
  }
};
