import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// ─── Authenticate User ─────────────────────────────────────
export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as any;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || "user", // fallback prevents crash
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
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRole = (user.role || "user").toLowerCase();
    const allowedRoles = roles.map((r) => r.toLowerCase());

    // superadmin bypass
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