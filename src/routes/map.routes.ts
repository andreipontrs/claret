import { Router } from "express";
import { getMapInventory } from "../controllers/map.controllers";
import { updateCoordinates } from "../controllers/bloodbank.controller";
import { authenticateUser, authorizeRole } from "../middleware/auth.middleware";

const router = Router();

// ── Public ───────────────────────────────────
router.get("/map-inventory", getMapInventory);

// ── Admin only ───────────────────────────────
router.patch(
  "/blood-banks/:id/coordinates",
  authenticateUser,
  authorizeRole("admin"),
  updateCoordinates
);

export default router;