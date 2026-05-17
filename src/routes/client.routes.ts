import { Router } from "express";
import { getClientDashboardCounts } from "../controllers/client";
import {
  authenticateUser,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/dashboard-counts",
  authenticateUser,
  authorizeRole("client"),
  getClientDashboardCounts
);

export default router;