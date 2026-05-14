// controllers/inventory.controller.ts
import { Request, Response } from "express";
import BloodBank from "../models/bloodbank";
import BloodbankInventory from "../models/inventory.bloodbank";
import { Op } from "sequelize";

export const getMyInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Get the logged-in user's id from JWT (set by your authenticate middleware)
    const userId = (req as any).user.id;

    // 2. Find the blood bank account linked to this user
    const bloodBank = await BloodBank.findOne({ where: { userId } });
    if (!bloodBank) {
      res.status(404).json({ message: "No blood bank account found for this user." });
      return;
    }

    const { facilityNo } = bloodBank;

    // 3. Fetch all inventory rows for this facility
    if (!facilityNo) {
    res.status(400).json({ message: "Blood bank has no facility number assigned." });
    return;
    }

    // Now TypeScript knows facilityNo is string, not string | null
    const rows = await BloodbankInventory.findAll({
    where: { facilityNo, status: "available", },  // ✅ no longer string | null
    attributes: ["bloodType", "component", "units"],
    order: [["bloodType", "ASC"]],
    });

    // 4. Group by bloodType, then sum units per component
    //    Output shape matches what your frontend cards expect:
    //    { type: "A+", units: 12, components: { "Whole Blood": 5, "Packed RBC": 7 } }
    const grouped: Record<string, { units: number; components: Record<string, number> }> = {};

    for (const row of rows) {
      const { bloodType, component, units } = row;

      if (!grouped[bloodType]) {
        grouped[bloodType] = { units: 0, components: {} };
      }

      grouped[bloodType].units += units;

      if (!grouped[bloodType].components[component]) {
        grouped[bloodType].components[component] = 0;
      }
      grouped[bloodType].components[component] += units;
    }

    // 5. Convert to array sorted by blood type
    const BLOOD_TYPE_ORDER = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    const summary = BLOOD_TYPE_ORDER
      .filter((bt) => grouped[bt]) // only include types that have inventory
      .map((bt) => ({
        type: bt,
        units: grouped[bt].units,
        components: grouped[bt].components,
      }));

    res.status(200).json({
      message: "Inventory fetched successfully.",
      facilityNo,
      data: summary,
    });
  } catch (error) {
    console.error("getMyInventory error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};