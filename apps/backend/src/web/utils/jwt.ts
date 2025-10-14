// poll-generation-backend/src/utils/jwt.ts
// File: apps/backend/src/web/utils/jwt.ts
import jwt from 'jsonwebtoken';

export const signToken = (payload: object) => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });
};

export const signShortToken = (payload: object) => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
};

export const signRefreshToken = (payload: object) => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '30d' });
};

export const extractIdFromToken = (token: string) => {
  return jwt.decode(token) as { id: string };
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET as string);
};

export const isTokenExpired = (token: string): boolean => {
  try {
    jwt.verify(token, process.env.JWT_SECRET as string);
    return false;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return true;
    }
    throw error; // Re-throw non-expiration errors
  }
};

export const refreshAccessToken = (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string) as { id: string, role: string };
    // Generate new access token with shorter expiration
    return signShortToken({ id: decoded.id, role: decoded.role });
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};