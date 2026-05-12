import { Request, Response } from "express";
import Profile from "../models/profile";
import User from "../models/user";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

function classifyUser(profile: Profile): "donor" | "recipient" | "both" | "unclassified" {
  if (profile.willingToDonate && profile.needBlood) return "both";
  if (profile.willingToDonate) return "donor";
  if (profile.needBlood) return "recipient";
  return "unclassified";
}

function isProfileComplete(profile: Profile): boolean {
  return !!(
    profile.dob &&
    profile.gender &&
    profile.city &&
    profile.bloodType
  );
}

const ALLOWED_PROFILE_FIELDS = [
  "dob",
  "gender",
  "street",
  "city",
  "province",
  "zip",
  "nationality",
  "religion",
  "education",
  "occupation",
  "civilStatus", // ✅ added
  "bloodType",
  "medicalConditions",
  "willingToDonate",
  "lastDonationDate",
  "preferredDonationLocation",
  "needBlood",
  "bloodTypeNeeded",
  "unitsNeeded",
  "urgencyLevel",
  "hospital",
];

// GET Profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findByPk(userId, {
      attributes: ["first_name", "middle_name", "last_name", "email", "phone_number"],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const [profile] = await Profile.findOrCreate({
      where: { user_id: userId },
      defaults: {
        user_id: userId,
        willingToDonate: false,
        needBlood: false,
      },
    });

    res.json({
      first_name: user.get("first_name"),
      middle_name: user.get("middle_name"),
      last_name: user.get("last_name"),
      email: user.get("email"),
      phone_number: user.get("phone_number"),
      ...profile.toJSON(),
      classification: classifyUser(profile),
      profileComplete: isProfileComplete(profile),
    });
  } catch (err: any) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({
      message: "Failed to fetch profile",
      error: err.message,
    });
  }
};

// PUT Profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const safeUpdate: any = Object.fromEntries(
      Object.entries(req.body).filter(([key]) =>
        ALLOWED_PROFILE_FIELDS.includes(key)
      )
    );

    if (Object.keys(safeUpdate).length === 0) {
      return res.status(400).json({ message: "No valid profile fields to update" });
    }

    // Normalize bloodType casing
    if (safeUpdate.bloodType) {
      safeUpdate.bloodType = String(safeUpdate.bloodType)
        .toUpperCase()
        .replace(/\s+/g, "");
    }

    // Normalize bloodTypeNeeded casing
    if (safeUpdate.bloodTypeNeeded) {
      safeUpdate.bloodTypeNeeded = String(safeUpdate.bloodTypeNeeded)
        .toUpperCase()
        .replace(/\s+/g, "");
    }

    // Normalize zip
    if (safeUpdate.zip) {
      safeUpdate.zip = String(safeUpdate.zip).trim();
    }

    // Normalize civilStatus casing
    if (safeUpdate.civilStatus) {
      safeUpdate.civilStatus =
        String(safeUpdate.civilStatus).trim().charAt(0).toUpperCase() +
        String(safeUpdate.civilStatus).trim().slice(1).toLowerCase();
    }

    // Convert medicalConditions array to string for TEXT column
    if (
      safeUpdate.medicalConditions &&
      Array.isArray(safeUpdate.medicalConditions)
    ) {
      safeUpdate.medicalConditions = safeUpdate.medicalConditions
        .map((item: any) => String(item).trim())
        .filter(Boolean)
        .join(", ");
    }

    const [profile] = await Profile.findOrCreate({
      where: { user_id: userId },
      defaults: {
        user_id: userId,
        willingToDonate: false,
        needBlood: false,
      },
    });

    const updated = await profile.update(safeUpdate);

    res.json({
      message: "Profile updated successfully",
      classification: classifyUser(updated),
      profileComplete: isProfileComplete(updated),
      profile: updated.toJSON(),
    });
  } catch (err: any) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({
      message: "Failed to update profile",
      error: err.message,
    });
  }
};