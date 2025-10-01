// // poll-generation-backend/src/controllers/user.controller.ts

// import { Request, Response } from "express";
// import { User } from "../models/user.model";
// import { extractIdFromToken } from "../utils/jwt";

// class ValidationError extends Error {
//   constructor(message: string) {
//     super(message);
//     this.name = "ValidationError";
//   }
// }

// export const getProfile = async (req: Request, res: Response) => {
//   try {
//     const jwtUser = extractIdFromToken(
//       req.headers.authorization?.split(" ")[1] || ""
//     );
//     if (!jwtUser) {
//       throw new ValidationError("Unauthorized");
//     }
//     const user = await User.findById(jwtUser.id);
//     if (!user) {
//       throw new ValidationError("User not found");
//     }
//     res.json(user);
//   } catch (error) {
//     if (error instanceof ValidationError) {
//       res.status(400).json({ message: error.message });
//     } else {
//       console.error(error);
//       res.status(500).json({ message: "Internal Server Error" });
//     }
//   }
// };
// File: apps/backend/src/web/controllers/user.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model";
import { extractIdFromToken } from "../utils/jwt";
import { uploadStream } from "../utils/cloudinary";
import { sendResetEmail, sendEmail } from "../utils/email";

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// --- Get Profile ---
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const jwtUser = extractIdFromToken(
      req.headers.authorization?.split(" ")[1] || ""
    );
    if (!jwtUser) {
      throw new ValidationError("Unauthorized");
    }
    const user = await User.findById(jwtUser.id);
    if (!user) {
      throw new ValidationError("User not found");
    }
    res.json(user);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
    } else {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

// --- Update Profile ---
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { fullName, bio } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    user.fullName = fullName ?? user.fullName;
    user.bio = bio ?? user.bio;
    await user.save();

    res.status(200).json({ message: "Profile updated successfully.", user });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// --- Upload Avatar ---
export const uploadAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    if (!req.file) {
      res.status(400).json({ message: "No file uploaded." });
      return;
    }

    const result = await uploadStream(req.file.buffer);

    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: result.secure_url },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    res.status(200).json({
      message: "Avatar updated successfully",
      avatar: user.avatar,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({ message: "Internal Server Error during avatar upload." });
  }
};

// --- Change Password ---
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId).select("+password");
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Incorrect current password." });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// --- Delete Account ---
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { password } = req.body;

    const user = await User.findById(userId).select("+password");
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Incorrect password. Account deletion failed." });
      return;
    }

    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "Your account has been permanently deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

