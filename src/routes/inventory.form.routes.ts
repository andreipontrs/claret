import { Router } from "express";

import {
  createInventory,
  getAllInventory,
  getInventoryById,
  getInventorySummary,
  updateInventory,
  deleteInventory,
  decreaseInventory,
} from "../controllers/inventory.form.controllers";

import { getMyInventory } from "../controllers/inventory.controller";

import { authenticateUser, authorizeRole } from "../middleware/auth.middleware";

const router = Router();

// ── Middleware ──────────────────────────────────────────────
router.use(authenticateUser);

// ── Routes ──────────────────────────────────────────────────

// ✅ Create new inventory entry (admin/blood_bank only)
router.post(
  "/create-inventory",
  authorizeRole("blood_bank", "admin"),
  createInventory
);

// ✅ Get all inventory entries with filters
router.get(
  "/get-all-inventory",
  authorizeRole("blood_bank", "admin"),
  getAllInventory
);

// ✅ Get inventory summary grouped by blood type (used by the cards page)
router.get(
  "/get-inventory-summary",
  authorizeRole("blood_bank", "admin"),
  getInventorySummary
);

// ✅ Get single inventory entry
router.get(
  "/get-inventory/:id",
  authorizeRole("blood_bank", "admin"),
  getInventoryById
);

// ✅ Update inventory entry
router.put(
  "/update-inventory/:id",
  authorizeRole("blood_bank", "admin"),
  updateInventory
);

// ✅ Delete inventory entry
router.delete(
  "/delete-inventory/:id",
  authorizeRole("blood_bank", "admin"),
  deleteInventory
);

router.patch(
  "/decrease",
  authorizeRole("blood_bank", "admin"),
  decreaseInventory
);

router.get("/my", authenticateUser, authorizeRole("blood_bank"), getMyInventory);

export default router;