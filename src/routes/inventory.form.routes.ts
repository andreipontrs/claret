import { Router } from "express";

import {
  createInventory,
  createInventoryAdmin,
  getAllInventory,
  getInventoryById,
  getInventorySummary,
  updateInventory,
  deleteInventory,
  decreaseInventory,
} from "../controllers/inventory.form.controllers";

import { getMyInventory, getAllInventoryAdmin, getFacilities } from "../controllers/inventory.controller";

import { authenticateUser, authorizeRole } from "../middleware/auth.middleware";

const router = Router();

// ── Middleware ──────────────────────────────────────────────
router.use(authenticateUser);

// ── Routes ──────────────────────────────────────────────────

router.get("/facilities", authenticateUser, authorizeRole("admin"), getFacilities);

// ✅ Create new inventory entry (admin/blood_bank only)
router.post(
  "/create-inventory",
  authorizeRole("blood_bank", "admin"),
  createInventory
);

router.post(
  "/createinventory",
  authorizeRole("admin"),
  createInventoryAdmin
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
router.get("/", authenticateUser, authorizeRole("admin"), getAllInventoryAdmin);


export default router;