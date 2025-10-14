// // poll-generation-backend/src/models/user.model.ts


// import { Request, Response } from "express";
// import bcrypt from "bcryptjs";
// import { signToken } from "../utils/jwt";
// import crypto from "crypto";
// import mongoose from "mongoose";
// import { sendResetEmail } from "../utils/email";

// // Assuming the User model is defined in the same file
// export const userSchema = new mongoose.Schema({
//   fullName: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   role: { type: String, enum: ["host", "student"], default: "student" },
//   passwordReset: {
//     token: { type: String },
//     expires: { type: Date },
//     used: { type: Boolean },
//   },
// });
// const User = mongoose.model("User", userSchema);

// export { User };


// File: apps/backend/src/web/models/user.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: "host" | "student"; // <-- Re-added this critical field
  avatar?: string;
  bio?: string;
  passwordReset?: { token?: string; expires?: Date; used?: boolean };
}

export const userSchema = new Schema<IUser>({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["host", "student"], default: "student" }, // <-- Re-added this
  avatar: { type: String, default: "https://www.gravatar.com/avatar/?d=mp" },
  bio: { type: String, default: "", maxLength: 200 },
  passwordReset: { /* ... */ },
});

export const User = mongoose.model<IUser>("User", userSchema);






// import mongoose, { Document, Schema } from "mongoose";

// export interface IUser extends Document {
//   fullName: string;
//   email: string;
//   password: string;
//   // role: "host" | "student";
//   avatar?: string;
//   bio?: string;
//   passwordReset?: {
//     token?: string;
//     expires?: Date;
//     used?: boolean;
//   };
// }

// export const userSchema = new Schema<IUser>({
//   fullName: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   // role: { type: String, enum: ["host", "student"], default: "student" },
//   avatar: {
//     type: String,
//     default:
//       "https://www.gravatar.com/avatar/?d=mp",
//   },
//   bio: { type: String, default: "", maxLength: 200 },
//   passwordReset: {
//     token: { type: String },
//     expires: { type: Date },
//     used: { type: Boolean, default: false },
//   },
// });

// export const User = mongoose.model<IUser>("User", userSchema);
