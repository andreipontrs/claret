import { Router } from "express";
import multer from "multer";
import path from "path";
import {
  getUserContents,
  getUserContentById,
  createUserContent,
  updateUserContent,
  deleteUserContent,
} from "../controllers/userContent.controller";

const router = Router();

// Multer storage config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "..", "public", "uploads"));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

// Routes
router.get("/", getUserContents);
router.get("/:id", getUserContentById);
router.post("/", upload.single("file"), createUserContent);
router.put("/:id", upload.single("file"), updateUserContent);
router.delete("/:id", deleteUserContent);

export default router;