// controllers/inventory.controller.ts
import { Request, Response } from "express";
import BloodBank from "../models/bloodbank";
import BloodbankInventory from "../models/inventory.bloodbank";
import { Op } from "sequelize";
import { autoExpireInventory } from "../helpers/autoexpire"

const BLOOD_TYPE_ORDER = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

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

    await autoExpireInventory(facilityNo);

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

export const getAllInventoryAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;
 
    if (userRole !== "admin") {
      res.status(403).json({ message: "Access denied. Admin only." });
      return;
    }
 
    // 1. Get all active blood banks
    const banks = await BloodBank.findAll({
      where: { status: "active" },
      attributes: ["facilityNo"],
    });
 
    const facilityNos = banks
      .map((b: any) => b.facilityNo as string)
      .filter((fn): fn is string => Boolean(fn));
 
    if (facilityNos.length === 0) {
      res.status(200).json({
        message: "Inventory fetched successfully.",
        facilityNo: "all",
        data: [],
      });
      return;
    }
 
    // 2. Auto-expire all facilities in parallel
    await Promise.all(facilityNos.map((fn) => autoExpireInventory(fn)));
 
    // 3. Fetch ALL available inventory rows across every facility in one query
    const rows = await BloodbankInventory.findAll({
      where: {
        facilityNo: { [Op.in]: facilityNos },
        status: "available",
      },
      attributes: ["bloodType", "component", "units"],
    });
 
    // 4. Aggregate — same shape as getMyInventory but totals are system-wide
    const grouped: Record<string, { units: number; components: Record<string, number> }> = {};
 
    for (const row of rows) {
      const bloodType = row.get("bloodType") as string;
      const component = row.get("component") as string;
      const units     = row.get("units") as number;
 
      if (!grouped[bloodType]) {
        grouped[bloodType] = { units: 0, components: {} };
      }
      grouped[bloodType].units += units;
      grouped[bloodType].components[component] = (grouped[bloodType].components[component] ?? 0) + units;
    }
 
    const data = BLOOD_TYPE_ORDER
      .filter((bt) => grouped[bt])
      .map((bt) => ({
        type: bt,
        units: grouped[bt].units,
        components: grouped[bt].components,
      }));
 
    res.status(200).json({
      message: "Inventory fetched successfully.",
      facilityNo: "all",
      data,
    });
  } catch (error) {
    console.error("getAllInventoryAdmin error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};