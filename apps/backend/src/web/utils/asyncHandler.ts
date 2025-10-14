import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Async handler wrapper for Express routes
 * Wraps async route handlers to properly handle errors and match RequestHandler type
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;