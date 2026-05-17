import { Router } from "express";
import jwt from "jsonwebtoken";
import { adminLogin, getAdminAndBloodBanks, updateAdmin, updateBloodBank } from "../controllers/admin.controller";
import { authenticateUser, authorizeRole } from "../middleware/auth.middleware";
import {
  getBloodBankActiveUnits,
  getBloodBankPendingRequests,
  getBloodBankTodayAppointments,
  getBloodBankWeeklyApprovedRequests,
  getBloodBankLowStocks
} from "../controllers/bloodBankDashboard";

const router = Router();

router.get("/blood-units",        authenticateUser, authorizeRole("blood_bank"), getBloodBankActiveUnits);
router.get("/pending-requests",   authenticateUser, authorizeRole("blood_bank"), getBloodBankPendingRequests);
router.get("/today-appointments", authenticateUser, authorizeRole("blood_bank"), getBloodBankTodayAppointments);
router.get("/weekly-requests",    authenticateUser, authorizeRole("blood_bank"), getBloodBankWeeklyApprovedRequests);
router.get("/low-stocks", authenticateUser, authorizeRole("blood_bank"), getBloodBankLowStocks);

export default router;