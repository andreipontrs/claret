import { Router } from "express";
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  getMe,
  forgotPassword,  
  resetPassword,  
  registerAdmin  
} from "../controllers/auth.controller";
import { validateAdminRegister, signupValidation, signinValidation } from "../validation/auth.validation";
import { authenticateUser, authorizeRole } from "../middleware/auth.middleware";
import { handleValidation } from "../middleware/handleValidation";
import { loginLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/register-admin", validateAdminRegister, handleValidation, registerAdmin);
router.post("/register", signupValidation, handleValidation, register);
router.post("/login", loginLimiter, signinValidation, handleValidation, login);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.get("/me", authenticateUser, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get("/admin", authenticateUser, authorizeRole("admin"), (req, res) => {
  res.json({ message: "Welcome, admin." });
});

export default router;