import { Request, Response } from "express";
import User from "../models/user";
import Profile from "../models/profile";
import Role from "../models/role";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: [
        "id",
        "firstName",
        "middleName",
        "lastName",
        "suffix",
        "email",
        "phoneNumber",
        "isEmailVerified",
        "createdAt",
        "updatedAt",
      ],
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name"],
            where: {
                name: "client",
            },
        },
        {
          model: Profile,
          as: "profile",
          attributes: ["gender", "dob", "willingToDonate", "needBlood"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to get users",
      error: error.message,
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const {
      firstName,
      middleName,
      lastName,
      suffix,
      email,
      phoneNumber,
      gender,
      dob,
      birthday,
      status,
    } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    await user.update({
      firstName: firstName ?? user.firstName,
      middleName: middleName ?? user.middleName,
      lastName: lastName ?? user.lastName,
      suffix: suffix ?? user.suffix,
      email: email ?? user.email,
      phoneNumber: phoneNumber ?? user.phoneNumber,
      isEmailVerified:
        status === "Active"
          ? true
          : status === "Inactive"
          ? false
          : user.isEmailVerified,
    });

    const [profile] = await Profile.findOrCreate({
      where: { user_id: id },
      defaults: {
        user_id: id,
        willingToDonate: false,
        needBlood: false,
      },
    });

    await profile.update({
      gender: gender ?? profile.get("gender"),
      dob: dob ?? birthday ?? profile.get("dob"),
    });

    const updatedUser = await User.findByPk(id, {
      attributes: [
        "id",
        "firstName",
        "middleName",
        "lastName",
        "suffix",
        "email",
        "phoneNumber",
        "isEmailVerified",
        "createdAt",
        "updatedAt",
      ],
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name"],
        },
        {
          model: Profile,
          as: "profile",
          attributes: ["gender", "dob"],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};
