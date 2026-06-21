import { Router } from "express";
import { generateBloodBankReport, generateAdminReport } from "../controllers/report";
import { authenticateUser, authorizeRole } from "../middleware/auth.middleware";

const router = Router();


router.get(
  "/bloodbank",
  authenticateUser,
  authorizeRole("blood_bank", "admin"),
  generateBloodBankReport
);


router.get(
  "/admin",
  authenticateUser,
  authorizeRole("blood_bank", "admin"),
  generateAdminReport
);

export default router;