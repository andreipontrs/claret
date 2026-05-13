import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import User from "../models/user";
import Role from "../models/role";
import { sendVerificationEmail, sendResetPasswordEmail, sendAdminCredentialsEmail } from "../utils/email.service";

const generateRandomPassword = (length = 12): string => {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&";
  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
};

// ─── Token Generator ───────────────────────────────────────
const generateToken = (user: { id: string; email: string; role: string }) => {
  const options: SignOptions = {
    expiresIn:
      (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) || "7d",
  };

  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    options
  );
};

// ─── Helper: Get Role Name ─────────────────────────────────
const getUserRoleName = async (roleId: string): Promise<string> => {
  console.log("roleId received:", roleId);
  const role = await Role.findOne({ where: { id: roleId } });
  console.log("role found:", role?.name);
  return role?.name ?? "client";
};

// ─── Register ─────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      suffix,
      email,
      phoneNumber,
      password,
      confirmPassword,
    } = req.body;

    if (password !== confirmPassword) {
      res.status(400).json({ message: "Passwords do not match." });
      return;
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      res.status(409).json({ message: "Email is already registered." });
      return;
    }

    const existingPhone = await User.findOne({ where: { phoneNumber } });
    if (existingPhone) {
      res.status(409).json({ message: "Phone number is already registered." });
      return;
    }

    const clientRole = await Role.findOne({ where: { name: "client" } });
    if (!clientRole) {
      res.status(500).json({
        message: "Default role not found. Please run ORM seeder.",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const emailVerificationToken = uuidv4();
    const emailVerificationTokenExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    const newUser = await User.create({
      firstName,
      middleName: middleName || null,
      lastName,
      suffix: suffix || null,
      email,
      phoneNumber,
      password: hashedPassword,
      roleId: clientRole.id,
      emailVerificationToken,
      emailVerificationTokenExpires,
    });

    await sendVerificationEmail(email, firstName, emailVerificationToken);

    res.status(201).json({
      message:
        "Account created successfully. Please check your email to verify your account.",
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        suffix: newUser.suffix,
        email: newUser.email,
        isEmailVerified: newUser.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Admin Register ─────────────────────────────────────
export const registerAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      suffix,
      email,
      phoneNumber,
      adminKey,
    } = req.body;

    // 🔐 security check
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      res.status(403).json({ message: "Unauthorized admin creation attempt." });
      return;
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      res.status(409).json({ message: "Email is already registered." });
      return;
    }

    const existingPhone = await User.findOne({ where: { phoneNumber } });
    if (existingPhone) {
      res.status(409).json({ message: "Phone number is already registered." });
      return;
    }

    const adminRole = await Role.findOne({ where: { name: "admin" } });
    if (!adminRole) {
      res.status(500).json({ message: "Admin role not found." });
      return;
    }

    // 🔥 AUTO GENERATE PASSWORD
    const plainPassword = generateRandomPassword(12);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const newAdmin = await User.create({
      firstName,
      middleName: middleName || null,
      lastName,
      suffix: suffix || null,
      email,
      phoneNumber,
      password: hashedPassword,
      roleId: adminRole.id,
      isEmailVerified: true,
    });

    // 🔥 SEND EMAIL WITH CREDENTIALS
    await sendAdminCredentialsEmail(email, firstName, plainPassword);

    res.status(201).json({
      message: "Admin account created and credentials sent to email.",
      user: {
        id: newAdmin.id,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        email: newAdmin.email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Login ────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({ message: "No account found with that email." });
      return;
    }

    if (!user.isEmailVerified) {
      res.status(403).json({
        message: "Please verify your email before logging in.",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Incorrect password." });
      return;
    }

    const roleName = await getUserRoleName(user.roleId);

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: roleName,
    });

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: roleName,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Verify Email ─────────────────────────────────────────
export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const token = req.query.token as string;

    if (!token) {
      res.status(400).json({ message: "Verification token is required." });
      return;
    }

    const user = await User.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      res.status(400).json({ message: "Invalid verification token." });
      return;
    }

    if (
      user.emailVerificationTokenExpires &&
      user.emailVerificationTokenExpires < new Date()
    ) {
      res.status(400).json({
        message: "Verification token has expired.",
      });
      return;
    }

    await user.update({
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpires: null,
    });

    const roleName = await getUserRoleName(user.roleId);

    const jwtToken = generateToken({
      id: user.id,
      email: user.email,
      role: roleName,
    });

    res.status(200).json({
      message: "Email verified successfully.",
      token: jwtToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: roleName,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Resend Verification ──────────────────────────────────
export const resendVerification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(404).json({ message: "No account found with that email." });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({
        message: "This account is already verified.",
      });
      return;
    }

    const emailVerificationToken = uuidv4();
    const emailVerificationTokenExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await user.update({
      emailVerificationToken,
      emailVerificationTokenExpires,
    });

    await sendVerificationEmail(email, user.firstName, emailVerificationToken);

    res.status(200).json({
      message: "Verification email resent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Get Me ───────────────────────────────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;

    if (role === "blood_bank") {
      const BloodBank = (await import("../models/bloodbank")).default;
      const bloodBank = await BloodBank.findByPk(userId);
      if (!bloodBank) {
        res.status(404).json({ message: "Blood bank not found." });
        return;
      }
      res.status(200).json({
        user: {
          id: bloodBank.id,
          firstName: bloodBank.hospitalName,
          lastName: "",
          email: bloodBank.email,
          role: "blood_bank",
        },
      });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const roleName = await getUserRoleName(user.roleId);
    res.status(200).json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: roleName,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("getMe error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Forgot Password ───────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(200).json({ message: "If that email exists, a reset link has been sent." });
      return;
    }

    const resetToken = uuidv4();
    const resetTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await user.update({
      resetPasswordToken: resetToken,       // ✅ correct field name from User model
      resetPasswordExpires: resetTokenExpires, // ✅ correct field name from User model
    });

    await sendResetPasswordEmail(email, resetToken);

    res.status(200).json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Reset Password ────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({ where: { resetPasswordToken: token } }); // ✅ correct field name

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) { // ✅ correct field name
      res.status(400).json({ message: "Reset link is invalid or has expired." });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,    // ✅ correct field name
      resetPasswordExpires: null,  // ✅ correct field name
    });

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};