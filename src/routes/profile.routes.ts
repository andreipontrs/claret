import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/profile.controller";
import { authenticateUser, authorizeRole } from "../middleware/auth.middleware";

const router = Router();


router.get(
  "/profile",
  authenticateUser,
  authorizeRole("client", "blood_bank", "admin"),
  getProfile
);


router.put(
  "/profile",
  authenticateUser,
  authorizeRole("client"),
  updateProfile
);

export default router;