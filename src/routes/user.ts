import express from "express";
import { getAllUsers, updateUser } from "../controllers/user";
import {
  authenticateUser,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = express.Router();

router.get(
  "/",
  authenticateUser,
  authorizeRole("admin"),
  getAllUsers
);

router.patch(
  "/:id",
  authenticateUser,
  authorizeRole("admin"),
  updateUser
);

router.put(
  "/:id",
  authenticateUser,
  authorizeRole("admin"),
  updateUser
);

export default router;