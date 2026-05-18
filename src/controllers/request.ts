import { Request, Response } from "express";
import BloodTransfusionRequest from "../models/bloodRequest";

import Inventory from "../models/inventory.bloodbank";

type Params = {
  id: string;
};

export const BloodRequestStatus = async (
  req: Request<Params>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    const request = await BloodTransfusionRequest.findByPk(id);

    if (!request) {
      return res.status(404).json({
        message: "Blood request not found.",
      });
    }

    const { status, bloodId, bloodType, component, units, remarks, reason } = req.body;

    request.status = status;

    if (bloodType) request.bloodType = bloodType;
    if (component) request.component = component;
    if (units) request.units = units;
    if (remarks) request.remarks = remarks;

    if (status === "CANCELLED" && reason) {
      request.rejectionReason = reason;
    }

    if (status === "FULFILLED" && bloodId) {
        const inventory = await Inventory.findOne({
            where: { bloodId },
        });

        if (!inventory) {
            return res.status(404).json({
            message: "Inventory not found.",
            });
        }

        inventory.status = "used";

        await inventory.save();
        }

    request.reviewedAt = new Date();

    await request.save();

    return res.status(200).json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully.`,
      data: request,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};