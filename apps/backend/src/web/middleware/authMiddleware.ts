// apps/backend/src/web/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken'; // Import Secret type
import User, { IUser } from '../models/User'; // Import User model and IUser interface
import dotenv from 'dotenv';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('Error: JWT_SECRET is not defined in environment variables.');
  process.exit(1);
}

// Extend the Request interface to include a user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        fullName: string;
        email: string;
      };
    }
  }
}

/**
 * @desc    Protect routes - Authenticate user using JWT
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined; // Explicitly type token

  // Debug: Log incoming Authorization Header
  /* console.log('Debug: Incoming Authorization Header:', req.headers.authorization);*/

  // Check if Authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
     /* console.log('Debug: Extracted Token:', token); // Debug: Log extracted token */

      // Verify token
      // Cast jwtSecret to Secret to satisfy TypeScript
      const decoded = jwt.verify(token, jwtSecret as Secret) as { id: string };
     /* console.log('Debug: Decoded Token Payload:', decoded); // Debug: Log decoded payload */

      // Find user by ID and attach to request object
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        console.log(`Debug: User not found for decoded ID: ${decoded.id}`);
        return res.status(401).json({ message: 'Not authorized, user not found.' });
      }

      // Attach user information to the request object
       req.user = {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
      };
      console.log('Debug: User attached to request:', req.user); // Debug: Log attached user

      next(); // Proceed to the next middleware or route handler
    } catch (error: any) {
      console.error('Error in authentication middleware:', error);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Not authorized, token expired.' });
      }
      // Specific log for JsonWebTokenError (invalid signature, malformed, etc.)
      if (error.name === 'JsonWebTokenError') {
        console.error('Debug: JWT Error details:', error.message);
        return res.status(401).json({ message: 'Not authorized, invalid token.' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed.' });
    }
  } else {
    console.log('Debug: No Authorization header or not starting with Bearer.');
  }

  // If token is still undefined at this point, it means no valid token was found in the header
  if (!token) {
    console.log('Debug: No token found after header check.');
    return res.status(401).json({ message: 'Not authorized, no token provided.' });
  }
};
