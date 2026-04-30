import express from "express";
import { Request, Response, NextFunction } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import jwt from "jsonwebtoken";

import { authenticateUser, authorizeRole } from "../middleware/auth.middleware";
import {
  getContents,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
  reorderContent,
} from "../controllers/landingContent.controller";

const router = express.Router();

// ─────────────────────────────────────────────
// OPTIONAL AUTH
// Attaches req.user if a valid token exists,
// but does NOT block the request if there is no token.
// Used so public routes can still do role-aware filtering.
// ─────────────────────────────────────────────
const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      (req as any).user = {
        id:    decoded.id,
        email: decoded.email,
        role:  decoded.role || "user",
      };
    }
  } catch {
    // Invalid or expired token — ignore, treat as public request
  }
  next();
};

// ─────────────────────────────────────────────
// MULTER CONFIG
// ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (ext) {
    cb(null, true);
  } else {
    cb(new Error("Only images, PDFs, and documents are allowed"));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

// ─────────────────────────────────────────────
// ROUTES
//
// GET /getContent       → PUBLIC + role-aware
//   No token  → sees all content (regular user homepage)
//   admin     → sees only their own posts
//   blood_bank → sees only their own posts
//
// All write routes → PROTECTED (auth + role required)
// ─────────────────────────────────────────────

// ✅ PUBLIC but role-aware via optionalAuth
router.get("/getContent",          optionalAuth, getContents);
router.get("/getContentById/:id",  optionalAuth, getContentById);

// 🔒 PROTECTED — admin + blood_bank only
router.post(
  "/createContent",
  authenticateUser,
  authorizeRole("admin", "blood_bank"),
  upload.single("file"),
  createContent
);

router.put(
  "/updateContent/:id",
  authenticateUser,
  authorizeRole("admin", "blood_bank"),
  upload.single("file"),
  updateContent
);

// 🔒 PROTECTED — admin only
router.put(
  "/reorderContent",
  authenticateUser,
  authorizeRole("admin"),
  reorderContent
);

// 🔒 PROTECTED — admin can delete any, blood_bank can delete their own
router.delete(
  "/deleteContent/:id",
  authenticateUser,
  authorizeRole("admin", "blood_bank"),
  deleteContent
);

export default router;