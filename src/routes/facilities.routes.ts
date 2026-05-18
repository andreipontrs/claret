import { Router } from "express";
import { getFacilities } from "../controllers/facilities.controller";
import { authenticateUser, authorizeRole } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticateUser);

// GET /api/facilities — admin only
router.get("/", authorizeRole("admin", "client"), getFacilities);

export default router;