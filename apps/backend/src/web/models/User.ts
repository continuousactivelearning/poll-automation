// apps/backend/src/web/models/User.ts
import { Schema, model, Document, Types, HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt, { Secret, SignOptions } from 'jsonwebtoken'; // Import 'Secret' and 'SignOptions' types explicitly

// Define the interface for the methods that will be added to the schema
interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  getResetPasswordToken(): string;
  getSignedJwtToken(): string; // Method to generate JWT
}

// Define the interface for a User Document, extending Mongoose's Document
// Now, IUser extends Document and includes the methods interface
export interface IUser extends Document, IUserMethods {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  password?: string;
  googleId?: string;
  linkedinId?: string;
  createdAt: Date;
  updatedAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
}

// Define the User Schema
const UserSchema = new Schema<IUser, {}, IUserMethods>({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, 'Please enter a valid email address']
  },
  password: {
    type: String,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  linkedinId: {
    type: String,
    unique: true,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

// Hash password before saving the user (pre-save hook)
UserSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  this.updatedAt = new Date();
  next();
});

// Method to compare candidate password with hashed password
UserSchema.methods.comparePassword = async function (this: IUser, candidatePassword: string): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Method to generate and hash password reset token
 * This token is what will be sent to the user's email.
 * It's then hashed and stored in the database for comparison.
 */
UserSchema.methods.getResetPasswordToken = function(this: IUser): string {
  // Generate a random token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash the token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set token expire time (e.g., 10 minutes from now)
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return resetToken; // Return the unhashed token to be sent via email
};

/**
 * @desc    Generate and return JWT token
 * @returns {string} JWT token
 */
UserSchema.methods.getSignedJwtToken = function(this: IUser): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('Error: JWT_SECRET is not defined in environment variables when generating token.');
    throw new Error('JWT secret not configured.');
  }

  // Debugging log: Confirm jwtSecret type and value
  /*console.log(`Debug: JWT Secret type: ${typeof jwtSecret}, value length: ${jwtSecret.length}`);*/
  console.log(`${this.email} Logged-in successfully`);;

  // FIXED: Explicitly define expiresInValue as string to match ms.StringValue type
  const expiresInValue: string = process.env.JWT_EXPIRE || '1h';

  // FIXED: Use non-null assertion (!) and ensure it's treated as Secret type
  return jwt.sign({ id: this._id }, jwtSecret as Secret, {
    expiresIn: expiresInValue, // Pass the explicitly typed string value
  } as SignOptions); // Cast the options object to SignOptions
};

// Use HydratedDocument to correctly type the model instance
const User = model<IUser>('User', UserSchema);

export default User;
