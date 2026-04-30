import { Request, Response } from "express";
import sequelize from "../config/database";
import { QueryTypes } from "sequelize";

// GET /api/facilities
// Returns all facilities — admin sees all, used to populate facilityNo on login
export async function getFacilities(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const facilities = await sequelize.query(
      "SELECT * FROM facilities",
      { type: QueryTypes.SELECT }
    );
    return res.status(200).json(facilities);
  } catch (error: any) {
    console.error("GET FACILITIES ERROR:", error?.message);
    return res.status(500).json({ message: "Server error.", error: error?.message });
  }
}