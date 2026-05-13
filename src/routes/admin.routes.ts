import { Router } from "express";
import jwt from "jsonwebtoken";
import { adminLogin, getAdminAndBloodBanks, updateAdmin, updateBloodBank } from "../controllers/admin.controller";
import { authenticateUser, authorizeRole } from "../middleware/auth.middleware";

const router = Router();


// admin.routes.ts
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const admins = [
    { email: "admin@gmail.com", password: "admin123", role: "admin" },
    { email: "nq94265@gmail.com", password: " SuperAdmin123!", role: "superadmin" },
  ];

  const match = admins.find(a => a.email === email && a.password === password);
  if (!match) return res.status(401).json({ message: "Invalid credentials." });

  const token = jwt.sign(
    { role: match.role, email: match.email },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return res.status(200).json({ token, role: match.role });
});

router.get("/admin-dashboard", authenticateUser, authorizeRole("admin"), getAdminAndBloodBanks);


router.put(
  "/update-admin/:id",
  authenticateUser,
  authorizeRole("admin"),
  updateAdmin
);

router.put(
  "/update-bloodbank/:id",
  authenticateUser,
  authorizeRole("admin"),
  updateBloodBank
);

export default router;