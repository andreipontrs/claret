import { Router } from "express";
import jwt from "jsonwebtoken";
import { adminLogin } from "../controllers/admin.controller";

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


export default router;