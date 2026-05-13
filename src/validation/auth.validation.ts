import { body } from "express-validator";

export const validateAdminRegister = [
  body("firstName").notEmpty().withMessage("First name is required."),
  body("lastName").notEmpty().withMessage("Last name is required."),
  body("email").isEmail().withMessage("Valid email is required."),
  body("phoneNumber").notEmpty().withMessage("Phone number is required."),
  body("adminKey").notEmpty().withMessage("Admin key is required."),
];

export const signupValidation = [
  body("firstName")
    .notEmpty()
    .withMessage("First name is required."),

  body("middleName")
    .optional({ nullable: true })
    .isString()
    .withMessage("Middle name must be a string."),

  body("lastName")
    .notEmpty()
    .withMessage("Last name is required."),

  body("suffix")                          // ← added
    .optional({ nullable: true })
    .isString()
    .withMessage("Suffix must be a string.")
    .isLength({ max: 20 })
    .withMessage("Suffix must not exceed 20 characters."),

  body("email")
    .isEmail()
    .withMessage("A valid email is required."),

  body("phoneNumber")
    .notEmpty()
    .withMessage("Phone number is required.")
    .matches(/^[\d\s\-\+\(\)]{7,15}$/)
    .withMessage("A valid phone number is required."),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters."),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your password.")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),
];

export const signinValidation = [
  body("email")
    .isEmail()
    .withMessage("A valid email is required."),

  body("password")
    .notEmpty()
    .withMessage("Password is required."),
];