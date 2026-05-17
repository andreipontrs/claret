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
        },
        {
          model: Profile,
          as: "profile",
          attributes: ["gender", "dob"],
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

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [profile] = await Profile.findOrCreate({
      where: { user_id: id },
      defaults: {
        user_id: id,
        willingToDonate: false,
        needBlood: false,
    },
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};