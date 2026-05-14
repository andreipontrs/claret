import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user";
import Role from "../models/role";
import BloodBank from "../models/bloodbank";
import { Op } from "sequelize";

export async function adminLogin(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: "role" }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const role = await Role.findByPk(user.roleId);

    if (!role) {
      return res.status(500).json({ message: "Role not found." });
    }

    console.log("ADMIN LOGIN - role from DB:", role.name);

    if (role.name !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: "Email not verified." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password." });
    }

    const token = jwt.sign(
      {
        id: user.id,
        roleId: user.roleId,
        role: role.name,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    console.log("ADMIN LOGIN - token generated for role:", role.name);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {                    // ✅ added this
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: role.name,         // will be "admin"
      },
    });

  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);
    return res.status(500).json({ message: "Server error.", error });
  }
}

export const getAdminAndBloodBanks = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name"],
        },
      ],
    });

    const admins = users.filter(
      (u) => u.role?.name === "admin"
    );

    const bloodBanks = await BloodBank.findAll({
      attributes: ["id", "hospitalName", "address", "contactNo", "email", "status", "lon", "lat", "facility_no", "createdAt"],
    });

    res.json({
      success: true,
      admins,
      bloodBanks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAdmin = async (
  req: Request,
  res: Response
) => {
  try {

    const id = req.params.id as string;

    const {
      firstName,
      middleName,
      lastName,
      suffix,
      email,
    } = req.body;

    const existingEmail = await User.findOne({
      where: { email },
    });

    if (
      existingEmail &&
      existingEmail.id !== id
    ) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const admin = await User.findByPk(id);

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    await admin.update({
      firstName,
      middleName,
      lastName,
      suffix,
      email,
    });

    return res.json({
      success: true,
      message: "Admin updated successfully",
      admin,
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      message: "Server error",
    });

  }
};

export const updateBloodBank = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      hospitalName,
      address,
      contactNo,
      facilityNo,
      lat,
      lon,
      email,
    } = req.body;

    // Find the blood bank first
    const bloodBank = await BloodBank.findByPk(id);
    if (!bloodBank) {
      return res.status(404).json({ message: "Blood bank not found" });
    }

    const oldEmail = bloodBank.email; 

    if (email && email !== oldEmail) {
      const existingBloodBankEmail = await BloodBank.findOne({
        where: { email, id: { [Op.ne]: id } },
      });
      if (existingBloodBankEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const existingUserEmail = await User.findOne({ where: { email } });
      if (existingUserEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Update blood bank
    await bloodBank.update({
      hospitalName,
      address,
      contactNo,
      facilityNo,
      lat,
      lon,
      email,
    });

    const updateUserFields: Partial<{
      email: string;
      firstName: string;
    }> = {};

    if (email && email !== oldEmail) updateUserFields.email = email;
    if (hospitalName) updateUserFields.firstName = hospitalName;

    if (Object.keys(updateUserFields).length > 0) {
      await User.update(updateUserFields, {
        where: { email: oldEmail }, 
      });
    }

    return res.json({
      success: true,
      message: "Blood bank updated successfully",
      bloodBank,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};