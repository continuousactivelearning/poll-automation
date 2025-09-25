import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  fullName: { type: String, required: true }, // Keep for backward compatibility
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["host", "student"], default: "student" },
  bio: { type: String, default: "" },
  avatar: { type: String, default: "" },
  passwordReset: {
    token: { type: String },
    expires: { type: Date },
    used: { type: Boolean },
  },
});

const User = mongoose.model("User", userSchema);
export { User };