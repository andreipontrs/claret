import express from "express";
import { authenticateUser, authorizeRole } from "../middleware/auth.middleware";
import { BloodRequestStatus } from "../controllers/request";

const router = express.Router();

// ── UPDATE BLOOD REQUEST STATUS ─────────────────
router.patch(
  "/:id/status",
  authenticateUser,
  authorizeRole("admin", "blood_bank"),
  BloodRequestStatus
);

export default router;