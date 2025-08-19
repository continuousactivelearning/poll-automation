// apps/backend/src/web/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User"; // adjust path if needed

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
      };

      // Attach user to request
      (req as any).user = await User.findById(decoded.id).select("-password");

      return next();
    }

    res.status(401).json({ message: "Not authorized, no token" });
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};
