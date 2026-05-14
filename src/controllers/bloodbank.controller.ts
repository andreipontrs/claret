import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import BloodBank from "../models/bloodbank";
import BloodBankSchedule, { ALL_DAYS, DayOfWeek } from "../models/Bloodbank_schedule";
import Role from "../models/role";
import User from "../models/user";
import { sendActivationEmail } from "../utils/email.bloodbank";
import sequelize from "../config/database";

function generatePassword(length = 10) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

// ==============================
// CREATE / INVITE BLOOD BANK
// ==============================
export async function createBloodBankAccount(req: Request, res: Response) {
  const {
    hospitalName,
    address,
    contactNo,
    telephoneNo,
    email,
    walkInSchedule,
    lat,
    lon,
    facilityNo, 
  } = req.body;

  const plainPassword = generatePassword(12);
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const transaction = await sequelize.transaction();

  try {
    const normalizedEmail = email?.toLowerCase().trim();
    const normalizedHospitalName = hospitalName?.trim();
    const normalizedAddress = address?.trim();
    const normalizedContactNo = contactNo?.trim();
    const normalizedTelephoneNo = telephoneNo?.trim() || null;
    const normalizedFacilityNo = facilityNo?.trim();

    if (!normalizedEmail || !normalizedHospitalName || !normalizedAddress || !normalizedContactNo || !normalizedFacilityNo) {
      return res.status(400).json({
        message: "Email, hospital name, address, contact number, and facility number are required.",
      });
    }

    // =========================
    // GLOBAL DUPLICATE CHECK
    // =========================
    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });

    const existingBloodBank = await BloodBank.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser || existingBloodBank) {
      return res.status(409).json({
        message: "Email already in use.",
      });
    }

    // ALSO CHECK PHONE
    const existingPhoneUser = await User.findOne({
      where: { phoneNumber: normalizedContactNo },
    });

    const existingPhoneBank = await BloodBank.findOne({
      where: { contactNo: normalizedContactNo },
    });

    if (existingPhoneUser || existingPhoneBank) {
      return res.status(409).json({
        message: "Contact number already in use.",
      });
    }

    const existingFacilityNo = await BloodBank.findOne({
      where: { facilityNo: normalizedFacilityNo },
    });

    if (existingFacilityNo) {
      return res.status(409).json({
        message: "Facility number already in use.",
      });
    }

    const role = await Role.findOne({
      where: { name: "blood_bank" },
    });

    if (!role) {
      return res.status(500).json({ message: "blood_bank role not found." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // =========================
    // 1. CREATE USER FIRST
    // =========================
    const user = await User.create(
      {
        firstName: normalizedHospitalName, // hospital becomes user name
        lastName: "Blood Bank",
        email: normalizedEmail,
        phoneNumber: normalizedContactNo,
        password: hashedPassword,
        roleId: role.id,
        isEmailVerified: true,
      },
      { transaction }
    );

    // =========================
    // 2. CREATE BLOOD BANK
    // =========================
    const bank = await BloodBank.create(
      {
        hospitalName: normalizedHospitalName,
        address: normalizedAddress,
        contactNo: normalizedContactNo,
        telephoneNo: normalizedTelephoneNo,
        email: normalizedEmail,
        password: hashedPassword,
        roleId: role.id,
        facilityNo: normalizedFacilityNo, 
        status: "active",
        activationToken: token,
        activationTokenExpiry: expiry,
        lat,
        lon,
        userId: user.id, 
      },
      { transaction }
    );

    // =========================
    // 3. CREATE SCHEDULE
    // =========================
    const scheduleRows = ALL_DAYS.map((day: DayOfWeek) => {
      const submitted = Array.isArray(walkInSchedule)
        ? walkInSchedule.find((s: any) => s.day === day)
        : null;

      return {
        bloodBankId: bank.id,
        day,
        open: submitted?.open ?? false,
        startTime: submitted?.startTime ?? "08:00",
        endTime: submitted?.endTime ?? "17:00",
      };
    });

    await BloodBankSchedule.bulkCreate(scheduleRows, { transaction });

    await transaction.commit();

    // =========================
    // EMAIL
    // =========================
    const activationLink = `${process.env.FRONTEND_URL}/activate-account?token=${token}`;
    await sendActivationEmail(normalizedEmail, activationLink, plainPassword);

    return res.status(201).json({
      message: "Blood bank + user account created successfully.",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("CREATE ERROR:", error);
    return res.status(500).json({ message: "Server error." });
  }
}

// ==============================
// GET ALL BLOOD BANKS (admin)
// ==============================
export async function getAllBloodBanks(req: Request, res: Response) {
  try {
    const bloodBanks = await BloodBank.findAll({
      attributes: [
        "id",
        "hospitalName",
        "email",
        "address",
        "contactNo",
        "telephoneNo",
        "status",
        "createdAt",
        "lat",
        "lon",
        "facilityNo",
      ],
      include: [
        {
          model:      BloodBankSchedule,
          as:         "walkInSchedule",
          attributes: ["day", "open", "startTime", "endTime"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const data = bloodBanks.map((bank) => ({
      _id:            bank.id,
      name:           bank.hospitalName,
      email:          bank.email,
      address:        bank.address,
      contactNo:      bank.contactNo,
      telephoneNo:    bank.telephoneNo,
      status:         bank.status === "active" ? "Active" : "Pending",
      dateAdded:      (bank as any).createdAt,
      lat:            bank.lat,
      lon:            bank.lon,
      facilityNo:     bank.facilityNo ?? null,
      walkInSchedule: (bank as any).walkInSchedule ?? [],
    }));

    return res.status(200).json(data);
  } catch (error) {
    console.error("GET ALL BLOOD BANKS ERROR:", error);
    return res.status(500).json({ message: "Server error." });
  }
}

// ==============================
// PUBLIC: GET ALL ACTIVE BLOOD BANKS
// Used by the Donate form dropdown — includes walk-in schedule
// ==============================
export async function getActiveBloodBanks(req: Request, res: Response) {
  try {
    const banks = await BloodBank.findAll({
      where:      { status: "active" },
      attributes: ["id", "hospitalName", "address"],
      include: [
        {
          model:      BloodBankSchedule,
          as:         "walkInSchedule",
          attributes: ["day", "open", "startTime", "endTime"],
        },
      ],
    });

    return res.status(200).json(banks);
  } catch (error) {
    console.error("GET ACTIVE BLOOD BANKS ERROR:", error);
    return res.status(500).json({ message: "Server error." });
  }
}

// ==============================
// GET OWN PROFILE (blood bank)
// ==============================
export async function getMe(req: Request, res: Response) {
  try {
    const bankId = (req as any).user?.id;

    const bank = await BloodBank.findByPk(bankId, {
      attributes: ["id", "hospitalName", "email", "facilityNo", "status"],
      include: [
        {
          model:      BloodBankSchedule,
          as:         "walkInSchedule",
          attributes: ["day", "open", "startTime", "endTime"],
        },
      ],
    });

    if (!bank) {
      return res.status(404).json({ message: "Blood bank not found." });
    }

    return res.status(200).json({
      id:             bank.id,
      hospitalName:   bank.hospitalName,
      email:          bank.email,
      facilityNo:     bank.facilityNo ?? null,
      status:         bank.status,
      walkInSchedule: (bank as any).walkInSchedule ?? [],
    });
  } catch (error) {
    console.error("GET ME ERROR:", error);
    return res.status(500).json({ message: "Server error." });
  }
}

// ==============================
// DELETE BLOOD BANK
// ==============================
export async function deleteBloodBank(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const bloodBank = await BloodBank.findOne({ where: { id } });
    if (!bloodBank) {
      return res.status(404).json({ message: "Blood bank not found." });
    }

    // Schedules are deleted automatically via ON DELETE CASCADE
    await bloodBank.destroy();
    return res
      .status(200)
      .json({ message: "Blood bank removed successfully." });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return res.status(500).json({ message: "Server error." });
  }
}

// ==============================
// ACTIVATE ACCOUNT
// ==============================
export async function activateAccount(req: Request, res: Response) {
  const { token, password } = req.body;

  try {
    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and password are required." });
    }

    const bloodBank = await BloodBank.findOne({
      where: { activationToken: token },
    });
    if (!bloodBank) {
      return res.status(400).json({ message: "Invalid activation token." });
    }

    if (
      !bloodBank.activationTokenExpiry ||
      bloodBank.activationTokenExpiry < new Date()
    ) {
      return res.status(400).json({ message: "Activation link expired." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await bloodBank.update({
      password:              hashedPassword,
      status:                "active",
      activationToken:       null,
      activationTokenExpiry: null,
    });

    return res
      .status(200)
      .json({ message: "Account activated successfully." });
  } catch (error) {
    console.error("ACTIVATE ERROR:", error);
    return res.status(500).json({ message: "Server error." });
  }
}

// ==============================
// ADMIN: UPDATE COORDINATES
// ==============================
export async function updateCoordinates(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const { lat, lon } = req.body;

    if (lat === undefined || lon === undefined) {
      return res
        .status(400)
        .json({ message: "lat and lon are required." });
    }

    const bank = await BloodBank.findByPk(id);
    if (!bank) {
      return res.status(404).json({ message: "Blood bank not found." });
    }

    await bank.update({ lat, lon });

    return res.status(200).json({
      message: "Coordinates updated successfully.",
      data: { id: bank.id, lat: bank.lat, lon: bank.lon },
    });
  } catch (error) {
    console.error("UPDATE COORDINATES ERROR:", error);
    return res.status(500).json({ message: "Server error." });
  }
}

// ==============================
// ADMIN: UPDATE WALK-IN SCHEDULE
// PATCH /blood-banks/:id/schedule
// ==============================
export async function updateWalkInSchedule(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const { walkInSchedule } = req.body;

    if (!Array.isArray(walkInSchedule) || walkInSchedule.length === 0) {
      return res
        .status(400)
        .json({ message: "walkInSchedule array is required." });
    }

    const bank = await BloodBank.findByPk(id);
    if (!bank) {
      return res.status(404).json({ message: "Blood bank not found." });
    }

    // Upsert each day — update if exists, create if somehow missing
    for (const entry of walkInSchedule) {
      const { day, open, startTime, endTime } = entry;

      const [row] = await BloodBankSchedule.findOrCreate({
        where: { bloodBankId: id, day },
        defaults: { bloodBankId: id, day, open, startTime, endTime },
      });

      await row.update({ open, startTime, endTime });
    }

    const updated = await BloodBankSchedule.findAll({
      where:      { bloodBankId: id },
      attributes: ["day", "open", "startTime", "endTime"],
      order:      [["day", "ASC"]],
    });

    return res.status(200).json({
      message:        "Walk-in schedule updated successfully.",
      walkInSchedule: updated,
    });
  } catch (error) {
    console.error("UPDATE SCHEDULE ERROR:", error);
    return res.status(500).json({ message: "Server error." });
  }
}