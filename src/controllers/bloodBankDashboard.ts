import { Request, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import BloodBank from "../models/bloodbank";
import BloodDonationAppointment from "../models/donation";
import BloodTransfusionRequest from "../models/bloodRequest";
import Inventory, { BloodType } from "../models/inventory.bloodbank";

// ── Blood Bank: Active Blood Units (their facility only) ───────────────────
export const getBloodBankActiveUnits = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const bloodBank = await BloodBank.findOne({ where: { userId } });
    if (!bloodBank) {
      return res.status(404).json({ success: false, message: "Blood bank not found" });
    }

    if (!bloodBank.facilityNo) {
      return res.status(200).json({ success: true, data: { activeBloodUnits: 0 } });
    }

    const result = await Inventory.sum("units", {
      where: {
        facilityNo: bloodBank.facilityNo,
        status: "available",
      },
    });

    return res.status(200).json({
      success: true,
      data: { activeBloodUnits: result ?? 0 },
    });
  } catch (error) {
    console.error("getBloodBankActiveUnits error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch active blood units" });
  }
};

// ── Blood Bank: Pending Transfusion Requests (their account only) ───────────
export const getBloodBankPendingRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const bloodBank = await BloodBank.findOne({ where: { userId } });
    if (!bloodBank) {
      return res.status(404).json({ success: false, message: "Blood bank not found" });
    }

    const pendingRequests = await BloodTransfusionRequest.count({
      where: {
        requestToId: bloodBank.id,
        status: "PENDING",
      },
    });

    return res.status(200).json({
      success: true,
      data: { pendingRequests },
    });
  } catch (error) {
    console.error("getBloodBankPendingRequests error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch pending requests" });
  }
};

// ── Blood Bank: Today's Approved Donation Appointments ─────────────────────
export const getBloodBankTodayAppointments = async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const todayAppointments = await BloodDonationAppointment.count({
      where: {
        status: "APPROVED",
        appointmentDate: today,
      },
    });

    return res.status(200).json({
      success: true,
      data: { todayAppointments },
    });
  } catch (error) {
    console.error("getBloodBankTodayAppointments error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch today's appointments" });
  }
};

// ── Blood Bank: This Week's Approved Transfusion Requests (their account) ──
export const getBloodBankWeeklyApprovedRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const bloodBank = await BloodBank.findOne({ where: { userId } });
    if (!bloodBank) {
      return res.status(404).json({ success: false, message: "Blood bank not found" });
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weeklyApprovedRequests = await BloodTransfusionRequest.count({
      where: {
        requestToId: bloodBank.id,
        status: "APPROVED",
        createdAt: {
          [Op.between]: [monday, sunday],
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: { weeklyApprovedRequests },
    });
  } catch (error) {
    console.error("getBloodBankWeeklyApprovedRequests error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch weekly approved requests" });
  }
};

// ── Blood Bank: Low Stock Blood Types (≤10 units, their facility only) ──────
export const getBloodBankLowStocks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const bloodBank = await BloodBank.findOne({ where: { userId } });
    if (!bloodBank) {
      return res.status(404).json({ success: false, message: "Blood bank not found" });
    }

    if (!bloodBank.facilityNo) {
      return res.status(200).json({ success: true, data: { lowStocks: [] } });
    }

    const LOW_STOCK_THRESHOLD = 10;
    const allBloodTypes: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    const stockRaw = await Inventory.findAll({
      attributes: [
        "bloodType",
        [fn("SUM", col("units")), "totalUnits"],
      ],
      where: {
        facilityNo: bloodBank.facilityNo,
        status: "available",
      },
      group: ["bloodType"],
      raw: true,
    }) as unknown as { bloodType: BloodType; totalUnits: string }[];

    const stockMap = new Map<BloodType, number>(
      allBloodTypes.map((bt) => [bt, 0])
    );

    for (const row of stockRaw) {
      stockMap.set(row.bloodType, Number(row.totalUnits));
    }

    const lowStocks = Array.from(stockMap.entries())
      .filter(([, total]) => total <= LOW_STOCK_THRESHOLD)
      .map(([bloodType, totalUnits]) => ({ bloodType, totalUnits }));

    return res.status(200).json({
      success: true,
      data: { lowStocks },
    });
  } catch (error) {
    console.error("getBloodBankLowStocks error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch low stock blood types" });
  }
};