import { Request, Response } from "express";
import { Op } from "sequelize";

import DonationAppointment from "../models/donation";
import BloodTransfusionRequest from "../models/bloodRequest";
import BloodBank from "../models/bloodbank";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const getClientDashboardCounts = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingAppointments = await DonationAppointment.count({
      where: {
        userId,
        appointmentDate: {
          [Op.gte]: today,
        },
        status: {
          [Op.notIn]: ["APPROVED"],
        },
      },
    });

    const approvedBloodRequests = await BloodTransfusionRequest.count({
      where: {
        userId,
        status: "APPROVED",
      },
    });

    const bloodBanks = await BloodBank.count({
      where: {
        status: "active",
      },
    });

    const donationHistory = await DonationAppointment.count({
      where: {
        userId,
        status: {
          [Op.in]: ["FULFILLED",],
        },
      },
    });

    return res.status(200).json({
      message: "Client dashboard counts fetched successfully.",
      data: {
        upcomingAppointments,
        approvedBloodRequests,
        bloodBanks,
        donationHistory,
      },
    });
  } catch (error: any) {
    console.error("GET CLIENT DASHBOARD COUNTS ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch client dashboard counts.",
      error: error.message,
    });
  }
};