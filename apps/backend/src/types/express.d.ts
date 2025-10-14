// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'host' | 'student';
        iat?: number;
        exp?: number;
      };
    }
  }
}

export {};