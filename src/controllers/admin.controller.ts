import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user";
import Role from "../models/role";

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