import { body } from "express-validator";

// ==============================
// CREATE / INVITE BLOOD BANK
// ==============================
export const validateCreateBloodBank = [
  body("hospitalName")
    .notEmpty()
    .withMessage("Hospital name is required.")
    .isString()
    .withMessage("Hospital name must be a string.")
    .isLength({ min: 2, max: 100 })
    .withMessage("Hospital name must be between 2 and 100 characters.")
    .trim(),

  body("address")
    .notEmpty()
    .withMessage("Address is required.")
    .isString()
    .withMessage("Address must be a string.")
    .isLength({ min: 5, max: 255 })
    .withMessage("Address must be between 5 and 255 characters.")
    .trim(),

  body("contactNo")
    .notEmpty()
    .withMessage("Contact number is required.")
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage("Contact number must be a valid phone number (7–20 digits)."),

  body("telephoneNo")
    .optional()
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage(
      "Telephone number must be a valid phone number (7–20 digits)."
    ),

  body("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Must be a valid email address.")
    .normalizeEmail(),

  // --------------------------------------------------
  // Walk-in schedule (optional on creation)
  // --------------------------------------------------
  body("walkInSchedule")
    .optional()
    .isArray({ max: 7 })
    .withMessage("walkInSchedule must be an array of up to 7 entries."),

  body("walkInSchedule.*.day")
    .isIn([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ])
    .withMessage(
      "Each schedule entry must have a valid day " +
        "(Monday–Sunday)."
    ),

  body("walkInSchedule.*.open")
    .isBoolean()
    .withMessage(
      "Each schedule entry must have a boolean 'open' field."
    ),

  body("walkInSchedule.*.startTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage("startTime must be in HH:MM 24-hour format (e.g. 08:00)."),

  body("walkInSchedule.*.endTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage("endTime must be in HH:MM 24-hour format (e.g. 17:00)."),
];

// ==============================
// UPDATE WALK-IN SCHEDULE
// PATCH /blood-banks/:id/schedule
// ==============================
export const validateUpdateSchedule = [
  body("walkInSchedule")
    .notEmpty()
    .withMessage("walkInSchedule is required.")
    .isArray({ min: 1, max: 7 })
    .withMessage("walkInSchedule must be an array of 1–7 entries."),

  body("walkInSchedule.*.day")
    .notEmpty()
    .withMessage("Day is required for each schedule entry.")
    .isIn([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ])
    .withMessage(
      "Each schedule entry must have a valid day (Monday–Sunday)."
    ),

  body("walkInSchedule.*.open")
    .notEmpty()
    .withMessage("'open' is required for each schedule entry.")
    .isBoolean()
    .withMessage("'open' must be true or false."),

  body("walkInSchedule.*.startTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage("startTime must be in HH:MM 24-hour format (e.g. 08:00)."),

  body("walkInSchedule.*.endTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage("endTime must be in HH:MM 24-hour format (e.g. 17:00)."),
];

// ==============================
// ACTIVATE ACCOUNT
// ==============================
export const validateActivateAccount = [
  body("token")
    .notEmpty()
    .withMessage("Token is required.")
    .isString()
    .withMessage("Token must be a string."),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter.")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter.")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number.")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain at least one special character."),
];

// ==============================
// LOGIN
// ==============================
export const validateLogin = [
  body("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Must be a valid email address.")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required."),
];