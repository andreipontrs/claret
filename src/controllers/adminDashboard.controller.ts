import { Request, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import User from "../models/user";
import Role from "../models/role";
import BloodBank from "../models/bloodbank";
import BloodDonationAppointment from "../models/donation";
import BloodTransfusionRequest from "../models/bloodRequest";
import Inventory from "../models/inventory.bloodbank";
import Content from "../models/landingContent";
import Profile from "../models/profile";

// ── 1. Total Clients ────────────────────────────────────────────────────────
export const getTotalClients = async (req: Request, res: Response) => {
  try {
    const clientRole = await Role.findOne({ where: { name: "client" } });
    const totalClients = clientRole
      ? await User.count({ where: { roleId: clientRole.id } })
      : 0;

    return res.status(200).json({ success: true, data: { totalClients } });
  } catch (error) {
    console.error("getTotalClients error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch total clients" });
  }
};

// ── 2. Active Blood Banks ───────────────────────────────────────────────────
export const getActiveBloodBanks = async (req: Request, res: Response) => {
  try {
    const activeBloodBanks = await BloodBank.count({ where: { status: "active" } });

    return res.status(200).json({ success: true, data: { activeBloodBanks } });
  } catch (error) {
    console.error("getActiveBloodBanks error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch active blood banks" });
  }
};

// ── 3. Total Fulfilled Donations ────────────────────────────────────────────
export const getTotalDonations = async (req: Request, res: Response) => {
  try {
    const totalDonations = await BloodDonationAppointment.count({
      where: { status: "FULFILLED" },
    });

    return res.status(200).json({ success: true, data: { totalDonations } });
  } catch (error) {
    console.error("getTotalDonations error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch total donations" });
  }
};

// ── 4. Active Blood Units ───────────────────────────────────────────────────
export const getActiveBloodUnits = async (req: Request, res: Response) => {
  try {
    const result = await Inventory.sum("units", { where: { status: "available" } });
    const activeBloodUnits = result ?? 0;

    return res.status(200).json({ success: true, data: { activeBloodUnits } });
  } catch (error) {
    console.error("getActiveBloodUnits error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch active blood units" });
  }
};

// ── 5. Pending Transfusion Requests ────────────────────────────────────────
export const getPendingRequests = async (req: Request, res: Response) => {
  try {
    const pendingRequests = await BloodTransfusionRequest.count({
      where: { status: "PENDING" },
    });

    return res.status(200).json({ success: true, data: { pendingRequests } });
  } catch (error) {
    console.error("getPendingRequests error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch pending requests" });
  }
};

// ── 6. Scheduled Donations ──────────────────────────────────────────────────
export const getScheduledDonations = async (req: Request, res: Response) => {
  try {
    const scheduledDonations = await Content.count({ where: { type: "Announcement" } });

    return res.status(200).json({ success: true, data: { scheduledDonations } });
  } catch (error) {
    console.error("getScheduledDonations error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch scheduled donations" });
  }
};

// ── 7. Monthly Donations Graph ──────────────────────────────────────────────
export const getMonthlyDonations = async (req: Request, res: Response) => {
  try {
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    const raw = await BloodDonationAppointment.findAll({
      attributes: [
        [fn("MONTH", literal("`appointmentDate`")), "month"],
        [fn("COUNT", literal("`id`")), "count"],
      ],
      where: {
        status: "FULFILLED",
        appointmentDate: {
          [Op.between]: [
            new Date(`${year}-01-01`),
            new Date(`${year}-12-31`),
          ],
        },
      },
      group: [fn("MONTH", literal("`appointmentDate`"))],
      order: [[literal("month"), "ASC"]],
      raw: true,
    }) as unknown as { month: number; count: string }[];

    const monthlyDonations = Array.from({ length: 12 }, (_, i) => {
      const found = raw.find((r) => Number(r.month) === i + 1);
      return {
        month: i + 1,
        count: found ? Number(found.count) : 0,
      };
    });

    return res.status(200).json({
      success: true,
      data: { year, monthlyDonations },
    });
  } catch (error) {
    console.error("getMonthlyDonations error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch monthly donations" });
  }
};

// ── 8. Monthly NeedBlood vs WillingToDonate Graph ──────────────────────────
export const getMonthlyBloodNeeds = async (req: Request, res: Response) => {
  try {
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    const dateWhere = `\`created_at\` BETWEEN '${year}-01-01' AND '${year}-12-31'`;

    const needBloodRaw = await Profile.findAll({
      attributes: [
        [fn("MONTH", literal("`created_at`")), "month"],
        [fn("COUNT", literal("`id`")), "count"],
      ],
      where: {
        needBlood: true,
        [Op.and]: [literal(dateWhere)],
      },
      group: [fn("MONTH", literal("`created_at`"))],
      order: [[literal("month"), "ASC"]],
      raw: true,
    }) as unknown as { month: number; count: string }[];

    const willingRaw = await Profile.findAll({
      attributes: [
        [fn("MONTH", literal("`created_at`")), "month"],
        [fn("COUNT", literal("`id`")), "count"],
      ],
      where: {
        willingToDonate: true,
        [Op.and]: [literal(dateWhere)],
      },
      group: [fn("MONTH", literal("`created_at`"))],
      order: [[literal("month"), "ASC"]],
      raw: true,
    }) as unknown as { month: number; count: string }[];

    const monthly = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const needBlood = needBloodRaw.find((r) => Number(r.month) === monthNum);
      const willing = willingRaw.find((r) => Number(r.month) === monthNum);

      return {
        month: monthNum,
        needBlood: needBlood ? Number(needBlood.count) : 0,
        willingToDonate: willing ? Number(willing.count) : 0,
      };
    });

    return res.status(200).json({
      success: true,
      data: { year, monthly },
    });
  } catch (error) {
    console.error("getMonthlyBloodNeeds error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch monthly blood needs" });
  }
};