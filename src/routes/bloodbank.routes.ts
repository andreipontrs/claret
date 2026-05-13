import { Router } from "express";
import {
  createBloodBankAccount,
  activateAccount,
  getAllBloodBanks,
  deleteBloodBank,
  getActiveBloodBanks,
  updateCoordinates,
  updateFacilityNo,
  updateWalkInSchedule,
  getMe,
} from "../controllers/bloodbank.controller";
import { authenticateUser, authorizeRole } from "../middleware/auth.middleware";
import { handleValidation } from "../middleware/handleValidation";
import {
  validateCreateBloodBank,
  validateActivateAccount,
  validateUpdateSchedule,
} from "../validation/bloodbank.validation";

const router = Router();

// ── PUBLIC (no auth) ──────────────────────────────────────────────────────────

router.get("/active", getActiveBloodBanks);

router.post(
  "/activate-account",
  validateActivateAccount,
  handleValidation,
  activateAccount
);

// ── BLOOD BANK (own profile) ──────────────────────────────────────────────────

router.get(
  "/me",
  authenticateUser,
  authorizeRole("blood_bank"),
  getMe
);

// ── ADMIN ONLY ────────────────────────────────────────────────────────────────

router.get(
  "/",
  authenticateUser,
  authorizeRole("admin"),
  getAllBloodBanks
);

router.post(
  "/create-bloodbank",
  authenticateUser,
  authorizeRole("admin"),
  validateCreateBloodBank,
  handleValidation,
  createBloodBankAccount
);

router.delete(
  "/:id",
  authenticateUser,
  authorizeRole("admin"),
  deleteBloodBank
);

router.patch(
  "/:id/coordinates",
  authenticateUser,
  authorizeRole("admin"),
  updateCoordinates
);

router.patch(
  "/:id/facility-no",
  authenticateUser,
  authorizeRole("admin"),
  updateFacilityNo
);

router.patch(
  "/:id/schedule",
  authenticateUser,
  authorizeRole("admin"),
  validateUpdateSchedule,
  handleValidation,
  updateWalkInSchedule
);

export default router;