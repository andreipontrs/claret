import { body, param, query, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

// ── Helper: run validationResult and return 422 if errors exist ───────────────

export function validate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Validation failed.",
      errors: errors.array().map((e) => ({
        field: e.type === "field" ? e.path : undefined,
        message: e.msg,
      })),
    });
  }
  next();
}

// ── Reusable field rules ───────────────────────────────────────────────────────

const CIVIL_STATUSES = ["SINGLE", "MARRIED", "WIDOWED", "SEPARATED"] as const;
const SEXES = ["MALE", "FEMALE"] as const;
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const PH_MOBILE_REGEX = /^(\+?63|0)9\d{9}$/;
const PH_TELEPHONE_REGEX = /^(\+?63|0)\d{9,10}$/;

const nameField = (field: string, label: string, optional = false) => {
  const chain = body(field).trim();
  if (optional) {
    return chain
      .optional({ nullable: true, checkFalsy: true })
      .isLength({ max: 100 })
      .withMessage(`${label} must not exceed 100 characters.`)
      .matches(/^[a-zA-ZÀ-ÿ\s'\-\.]+$/)
      .withMessage(`${label} must contain letters only.`);
  }
  return chain
    .notEmpty().withMessage(`${label} is required.`)
    .isLength({ min: 2, max: 100 })
    .withMessage(`${label} must be between 2 and 100 characters.`)
    .matches(/^[a-zA-ZÀ-ÿ\s'\-\.]+$/)
    .withMessage(`${label} must contain letters only.`);
};

// ── CREATE validator ──────────────────────────────────────────────────────────

export const validateCreateAppointment = [
  nameField("firstName", "First name"),
  nameField("middleName", "Middle name", true),
  nameField("lastName", "Last name"),

  body("birthday")
    .notEmpty().withMessage("Birthday is required.")
    .isISO8601().withMessage("Birthday must be a valid date (YYYY-MM-DD).")
    .custom((value) => {
      const birth = new Date(value);
      const today = new Date();
      if (birth >= today) throw new Error("Birthday must be in the past.");
      return true;
    }),

  body("age")
    .notEmpty().withMessage("Age is required.")
    .isInt({ min: 16, max: 65 })
    .withMessage("Donor age must be between 16 and 65.")
    .toInt(),

  body("civilStatus")
    .notEmpty().withMessage("Civil status is required.")
    .isIn(CIVIL_STATUSES)
    .withMessage(`Civil status must be one of: ${CIVIL_STATUSES.join(", ")}.`),

  body("sex")
    .notEmpty().withMessage("Sex is required.")
    .isIn(SEXES)
    .withMessage(`Sex must be one of: ${SEXES.join(", ")}.`),

  body("street")
    .trim()
    .notEmpty().withMessage("Street is required.")
    .isLength({ max: 200 }).withMessage("Street must not exceed 200 characters."),

  body("city")
    .trim()
    .notEmpty().withMessage("City is required.")
    .isLength({ max: 100 }).withMessage("City must not exceed 100 characters."),

  body("province")
    .trim()
    .notEmpty().withMessage("Province is required.")
    .isLength({ max: 100 }).withMessage("Province must not exceed 100 characters."),

  body("zipCode")
    .trim()
    .notEmpty().withMessage("ZIP code is required.")
    .matches(/^\d{4}$/).withMessage("ZIP code must be a 4-digit number."),

  body("nationality")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage("Nationality must not exceed 100 characters."),

  body("religion")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage("Religion must not exceed 100 characters."),

  body("education")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 150 }).withMessage("Education must not exceed 150 characters."),

  body("occupation")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 150 }).withMessage("Occupation must not exceed 150 characters."),

  body("telephoneNumber")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(PH_TELEPHONE_REGEX)
    .withMessage("Telephone number must be a valid Philippine landline (e.g. 028XXXXXXX or +6328XXXXXXX)."),

  body("mobileNumber")
    .trim()
    .notEmpty().withMessage("Mobile number is required.")
    .matches(PH_MOBILE_REGEX)
    .withMessage("Mobile number must be a valid Philippine number (e.g. 09XXXXXXXXX or +639XXXXXXXXX)."),

  body("email")
    .trim()
    .notEmpty().withMessage("Email address is required.")
    .isEmail().withMessage("Email address must be valid.")
    .normalizeEmail()
    .isLength({ max: 254 }).withMessage("Email address must not exceed 254 characters."),

  body("bloodType")
    .notEmpty().withMessage("Blood type is required.")
    .isIn(BLOOD_TYPES)
    .withMessage(`Blood type must be one of: ${BLOOD_TYPES.join(", ")}.`),

  body("appointmentDate")
    .notEmpty().withMessage("Appointment date is required.")
    .isISO8601().withMessage("Appointment date must be a valid date (YYYY-MM-DD).")
    .custom((value) => {
      const appt = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (appt < today) throw new Error("Appointment date must not be in the past.");
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 6);
      if (appt > maxDate) throw new Error("Appointment date must be within the next 6 months.");
      return true;
    }),

  body("appointmentTime")
    .notEmpty().withMessage("Appointment time is required.")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Appointment time must be in HH:mm format."),

  body("latitude")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be a valid coordinate between -90 and 90.")
    .toFloat(),

  body("longitude")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be a valid coordinate between -180 and 180.")
    .toFloat(),

  body("locationAddress")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage("Location address must not exceed 500 characters."),

  validate,
];

// ── UPDATE validator ──────────────────────────────────────────────────────────
// ✅ FIX: use checkFalsy:true on appointmentDate and appointmentTime so that
//         empty strings from FormData are treated as "not provided" and skipped,
//         instead of being validated and failing.

export const validateUpdateAppointment = [
  param("id")
    .isUUID().withMessage("Invalid appointment ID."),

  nameField("firstName", "First name", true),
  nameField("middleName", "Middle name", true),
  nameField("lastName", "Last name", true),

  body("birthday")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage("Birthday must be a valid date.")
    .custom((value) => {
      if (new Date(value) >= new Date()) throw new Error("Birthday must be in the past.");
      return true;
    }),

  body("age")
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 16, max: 65 })
    .withMessage("Donor age must be between 16 and 65.")
    .toInt(),

  body("civilStatus")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(CIVIL_STATUSES)
    .withMessage(`Civil status must be one of: ${CIVIL_STATUSES.join(", ")}.`),

  body("sex")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(SEXES)
    .withMessage(`Sex must be one of: ${SEXES.join(", ")}.`),

  body("street")
    .optional({ nullable: true, checkFalsy: true })
    .trim().isLength({ max: 200 }).withMessage("Street must not exceed 200 characters."),

  body("city")
    .optional({ nullable: true, checkFalsy: true })
    .trim().isLength({ max: 100 }).withMessage("City must not exceed 100 characters."),

  body("province")
    .optional({ nullable: true, checkFalsy: true })
    .trim().isLength({ max: 100 }).withMessage("Province must not exceed 100 characters."),

  body("zipCode")
    .optional({ nullable: true, checkFalsy: true })
    .trim().matches(/^\d{4}$/).withMessage("ZIP code must be a 4-digit number."),

  body("telephoneNumber")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(PH_TELEPHONE_REGEX)
    .withMessage("Telephone number must be a valid Philippine landline."),

  body("mobileNumber")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(PH_MOBILE_REGEX)
    .withMessage("Mobile number must be a valid Philippine number (e.g. 09XXXXXXXXX)."),

  body("email")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail().withMessage("Email address must be valid.")
    .normalizeEmail(),

  body("bloodType")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(BLOOD_TYPES)
    .withMessage(`Blood type must be one of: ${BLOOD_TYPES.join(", ")}.`),

  // ✅ KEY FIX: checkFalsy:true skips validation when FormData sends empty string
  body("appointmentDate")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage("Appointment date must be a valid date (YYYY-MM-DD).")
    .custom((value) => {
      const appt = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (appt < today) throw new Error("Appointment date must not be in the past.");
      return true;
    }),

  // ✅ KEY FIX: checkFalsy:true skips validation when FormData sends empty string
  body("appointmentTime")
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Appointment time must be in HH:mm format."),

  body("latitude")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90.").toFloat(),

  body("longitude")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180.").toFloat(),

  validate,
];

// ── REVIEW validator ──────────────────────────────────────────────────────────

export const validateReviewAppointment = [
  param("id")
    .isUUID().withMessage("Invalid appointment ID."),

  body("status")
    .notEmpty().withMessage("Status is required.")
    .isIn(["APPROVED", "REJECTED", "FULFILLED"])
    .withMessage("Status must be APPROVED, REJECTED, or FULFILLED."),

  body("reviewNotes")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage("Review notes must not exceed 1000 characters."),

  validate,
];

// ── CANCEL / GET ONE validator ────────────────────────────────────────────────

export const validateIdParam = [
  param("id")
    .isUUID().withMessage("Invalid appointment ID."),

  validate,
];

// ── GET ALL query validator ───────────────────────────────────────────────────

export const validateListQuery = [
  query("status")
    .optional()
    .isIn(["PENDING", "APPROVED", "REJECTED", "CANCELLED", "FULFILLED"])
    .withMessage("Invalid status filter."),

  query("bloodType")
    .optional()
    .isIn(BLOOD_TYPES)
    .withMessage("Invalid blood type filter."),

  query("from")
    .optional()
    .isISO8601().withMessage("'from' must be a valid date (YYYY-MM-DD)."),

  query("to")
    .optional()
    .isISO8601().withMessage("'to' must be a valid date (YYYY-MM-DD).")
    .custom((value, { req }) => {
      if (req.query?.from && new Date(value) < new Date(req.query.from as string)) {
        throw new Error("'to' date must be after 'from' date.");
      }
      return true;
    }),

  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer."),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),

  validate,
];