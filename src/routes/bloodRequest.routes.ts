import { Router } from "express";
import multer from "multer";
import path from "path";

import {
  createTransfusionRequest,
  getAllTransfusionRequests,
  getTransfusionRequestById,
  updateTransfusionRequest,
  updateBloodRequestStatus,
  cancelTransfusionRequest,
  getMyBloodRequestNotifications,
  getMyTransfusionRequests,
  requestClearerImage,   // ← new
  reuploadReferral,  
  getMyBloodBankRequests,
  BloodRequestStatus    // ← new
} from "../controllers/bloodRequest.controller";

import {
  createTransfusionRequestValidation,
  reviewTransfusionRequestValidation,
} from "../validation/bloodRequest.validation";

import { authenticateUser, authorizeRole } from "../middleware/auth.middleware";
import { handleValidation } from "../middleware/handleValidation";

const router = Router();

// ── MULTER — original upload (image + file fields) ────────────────────────────

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    if (file.fieldname === "image") {
      cb(null, "public/uploads/transfusion-requests/images");
    } else {
      cb(null, "public/uploads/transfusion-requests/files");
    }
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.fieldname === "image") {
    const allowed = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext) && allowed.test(file.mimetype)) return cb(null, true);
    return cb(new Error("Only JPEG and PNG images allowed"));
  }
  if (file.fieldname === "file") {
    const ext = path.extname(file.originalname).toLowerCase();
    if (/pdf|doc|docx/.test(ext)) return cb(null, true);
    return cb(new Error("Only PDF/DOC/DOCX allowed"));
  }
  cb(new Error("Invalid field"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "file",  maxCount: 1 },
]);

// ── MULTER — reupload (single image field only) ───────────────────────────────

const reuploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "public/uploads/transfusion-requests/images");
  },
  filename: (_req, file, cb) => {
    const unique = `reupload-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const reuploadFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext) && /image\/(jpeg|png|webp)/.test(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error("Only JPEG, PNG, or WEBP images allowed for re-upload"));
};

const reuploadUpload = multer({
  storage: reuploadStorage,
  fileFilter: reuploadFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("image");

// ── AUTH (applied to all routes below) ───────────────────────────────────────
router.use(authenticateUser);

router.patch(
  "/:id/status",
  authenticateUser,
  authorizeRole("admin", "blood_bank"),
  BloodRequestStatus
);

// ── CLIENT ROUTES ─────────────────────────────────────────────────────────────

router.get(
  "/transfusion-requests/my-blood-bank-requests",
  authenticateUser,
  authorizeRole("blood_bank"),
  getMyBloodBankRequests
);

// Specific routes FIRST — before any /:id routes
router.get(
  "/transfusion-requests/my-notifications",
  authorizeRole("client"),
  getMyBloodRequestNotifications
);

router.get(
  "/transfusion-requests/my-requests",
  authorizeRole("client"),
  getMyTransfusionRequests
);

// Create
router.post(
  "/transfusion-requests",
  authorizeRole("client"),
  uploadFields,
  createTransfusionRequestValidation,
  handleValidation,
  createTransfusionRequest
);

// Update
router.put(
  "/transfusion-requests/:id",
  authorizeRole("client"),
  uploadFields,
  createTransfusionRequestValidation,
  handleValidation,
  updateTransfusionRequest
);

// Cancel (client)
router.patch(
  "/transfusion-requests/:id/cancel",
  authorizeRole("client"),
  cancelTransfusionRequest
);

// Re-upload referral document (client — after being asked for a clearer image)
router.post(
  "/transfusion-requests/:id/reupload",
  authorizeRole("client"),
  reuploadUpload,
  reuploadReferral
);

// ── ADMIN / BLOOD BANK ROUTES ─────────────────────────────────────────────────

// Get all
router.get(
  "/transfusion-requests",
  authorizeRole("blood_bank", "admin"),
  getAllTransfusionRequests
);

// Get one
router.get(
  "/transfusion-requests/:id",
  authorizeRole("blood_bank", "admin", "client"),
  getTransfusionRequestById
);

router.patch(
  "/transfusion-requests/:id/status",
  authorizeRole("blood_bank", "admin"),
  handleValidation,
  updateBloodRequestStatus
);

// Request clearer image — sets status to WAITING_FOR_REUPLOAD + sends email
router.post(
  "/transfusion-requests/:id/request-clearer-image",
  authorizeRole("blood_bank", "admin"),
  requestClearerImage
);

export default router;