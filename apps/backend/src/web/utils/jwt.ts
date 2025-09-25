import jwt from 'jsonwebtoken';

export const signToken = (payload: object) => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '7d' });
};
export const extractIdFromToken = (token: string) => {
  return jwt.decode(token) as { id: string };
  
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET as string);
};