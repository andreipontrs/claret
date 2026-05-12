import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ─── Authenticate User ─────────────────────────────────────
export const authenticateUser = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || "user",
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Unauthorized – invalid or expired token",
    });
  }
};

// ─── Authorize Role ────────────────────────────────────────
export const authorizeRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRole = (user.role || "user").toLowerCase();
    const allowedRoles = roles.map((r) => r.toLowerCase());

    if (userRole === "superadmin") {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: `Forbidden – role '${userRole}' not allowed`,
      });
    }

    next();
  };
};