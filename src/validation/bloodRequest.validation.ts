import { body, CustomValidator } from "express-validator";
import { Request } from "express";

const VALID_SEX = ["MALE", "FEMALE", "OTHER"];

const VALID_CIVIL_STATUS = [
  "SINGLE",
  "MARRIED",
  "WIDOWED",
  "SEPARATED",
  "DIVORCED",
];

// ── Custom file attachment validator ──────────────────────────────────────────

const hasAtLeastOneAttachment: CustomValidator = (_value, { req }) => {
  const files = (req as Request).files as
    | Record<string, Express.Multer.File[]>
    | undefined;

  const imageCount = files?.image?.length ?? 0;
  const fileCount  = files?.file?.length  ?? 0;

  if (imageCount + fileCount === 0) {
    throw new Error("At least one attachment (image or file) is required.");
  }

  return true;
};

// ── CREATE VALIDATION ─────────────────────────────────────────────────────────

export const createTransfusionRequestValidation = [
  body().custom(hasAtLeastOneAttachment),

  body("firstName").isString().trim().notEmpty(),
  body("middleName").optional({ nullable: true }).isString().trim(),
  body("lastName").isString().trim().notEmpty(),

  body("age")
    .isInt({ min: 0, max: 150 })
    .withMessage("age must be a valid integer."),

  body("birthday")
    .isISO8601()
    .withMessage("birthday must be a valid date."),

  body("civilStatus")
    .isIn(VALID_CIVIL_STATUS)
    .withMessage("Invalid civilStatus."),

  body("sex")
    .isIn(VALID_SEX)
    .withMessage("Invalid sex."),

  body("street").isString().trim().notEmpty(),
  body("city").isString().trim().notEmpty(),
  body("province").isString().trim().notEmpty(),

  body("zipCode")
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 10 }),

  body("mobileNumber")
    .isString()
    .trim()
    .notEmpty()
    .matches(/^[\d\s\-\+\(\)]{7,15}$/)
    .withMessage("Invalid mobile number."),

  body("email")
    .isEmail()
    .withMessage("Invalid email address."),
];

// ── REVIEW VALIDATION ─────────────────────────────────────────────────────────
// Simplified — only the 4 real statuses are valid for admin review actions.

export const reviewTransfusionRequestValidation = [
  body("status")
    .isIn(["APPROVED", "FULFILLED", "CANCELLED"])
    .withMessage("Invalid status. Must be APPROVED, FULFILLED, or CANCELLED."),
];