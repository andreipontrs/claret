import { Router } from "express";
import multer from "multer";
import path from "path";
import { authenticateUser, authorizeRole } from "../middleware/auth.middleware";
import {
  createDonationAppointment,
  getAllDonationAppointments,
  getDonationAppointmentById,
  updateDonationAppointment,
  reviewDonationAppointment,
  cancelDonationAppointment,
  getMyDonationNotifications,
  getMyDonationAppointments,
  getMyBloodBankDonations
} from "../controllers/donation.controller";
import {
  validateCreateAppointment,
  validateUpdateAppointment,
  validateReviewAppointment,
  validateIdParam,
  validateListQuery,
} from "../validation/donation.validation";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "public/uploads/"),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  ext && mime ? cb(null, true) : cb(new Error("Only images and documents are allowed."));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadFields = upload.fields([
  { name: "image", maxCount: 5 },
  { name: "file", maxCount: 5 },
]);

const router = Router();

router.post("/createDonation", authenticateUser, uploadFields, validateCreateAppointment, createDonationAppointment);
router.get("/getAllDonation", authenticateUser, validateListQuery, getAllDonationAppointments);
router.get("/getDonation/:id", authenticateUser, validateIdParam, getDonationAppointmentById);
router.put("/updateDonation/:id", authenticateUser, uploadFields, validateUpdateAppointment, updateDonationAppointment);
router.patch("/reviewDonation/:id/review", authenticateUser, validateReviewAppointment, reviewDonationAppointment);
router.patch("/cancelDonation/:id/cancel", authenticateUser, validateIdParam, cancelDonationAppointment);

// ✅ Notifications
router.get("/my-notifications", authenticateUser, getMyDonationNotifications);

router.get(
  "/my-donations",
  authenticateUser,
  authorizeRole("client"),
  getMyDonationAppointments
);

router.get(
  "/bloodbank-donations",
  authenticateUser,
  authorizeRole("blood_bank"),
  getMyBloodBankDonations
);

export default router;