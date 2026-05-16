import { Request, Response } from "express";
import { Op } from "sequelize";
import BloodTransfusionRequest, {
  RequestStatus,
  Sex,
  CivilStatus,
} from "../models/bloodRequest";
import { restoreInventory } from "./inventory.form.controllers";
import { sendClearerImageRequestEmail } from "../utils/email.service";
import { sendSMS } from "../services/smsService";
import { smsTemplates } from "../template/smsTemplates";
import BloodBank from "../models/bloodbank";

const currentUserId = (req: AuthRequest): string => req.user!.id;

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const getMyBloodBankRequests = async (req: any, res: Response) => {
  try {

    const userId = req.user?.id;


    if (!userId) {
      console.log("❌ No user ID found");

      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // Find blood bank linked to logged in user
    const bloodBank = await BloodBank.findOne({
      where: {
        userId: userId,
      },
    });


    if (!bloodBank) {

      return res.status(404).json({
        message: "Blood bank account not found.",
      });
    }


    // Get requests assigned to this blood bank
    const requests = await BloodTransfusionRequest.findAll({
      where: {
        requestToId: bloodBank.id,
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Blood bank requests fetched successfully.",
      bloodBankId: bloodBank.id,
      data: requests,
    });
  } catch (error: any) {
    console.error("GET BLOOD BANK REQUESTS ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch requests.",
      error: error.message,
    });
  }
};

// ── CREATE ────────────────────────────────────────────────────────────────────

export async function createTransfusionRequest(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const {
      firstName,
      middleName,
      lastName,
      age,
      birthday,
      civilStatus,
      sex,
      street,
      city,
      province,
      zipCode,
      mobileNumber,
      email,
      requestToId,
    }: {
      firstName: string;
      middleName?: string | null;
      lastName: string;
      age: number;
      birthday: string;
      civilStatus: CivilStatus;
      sex: Sex;
      street: string;
      city: string;
      province: string;
      zipCode: string;
      mobileNumber: string;
      email: string;
      requestToId: string;
    } = req.body;

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    const attachments: string[] = [
      ...(files?.image?.map((f) => f.path) ?? []),
      ...(files?.file?.map((f) => f.path) ?? []),
    ];

    if (attachments.length === 0) {
      return res.status(400).json({
        message: "At least one upload (image or file) is required.",
      });
    }

    const request = await BloodTransfusionRequest.create({
      date: new Date(),
      userId: currentUserId(req),
      requestToId,
      firstName,
      middleName: middleName ?? null,
      lastName,
      age,
      birthday: new Date(birthday),
      civilStatus,
      sex,
      street,
      city,
      province,
      zipCode,
      mobileNumber,
      email,
      attachments,
      status: "PENDING",       // ← was WAITING_FOR_APPROVAL
      needsReupload: false,
    });

    return res.status(201).json({
      message: "Blood request submitted successfully.",
      data: request,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ── GET ALL ───────────────────────────────────────────────────────────────────

export async function getAllTransfusionRequests(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const { status, from, to, page = "1", limit = "20" } =
      req.query as Record<string, string>;

    const where: Record<string, any> = {};

    if (status) where.status = status;

    if (from || to) {
      where.date = {};
      if (from) where.date[Op.gte] = new Date(from);
      if (to) where.date[Op.lte] = new Date(to);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await BloodTransfusionRequest.findAndCountAll({
      where,
      order: [["date", "DESC"]],
      limit: limitNum,
      offset,
    });

    return res.status(200).json({
      message: "Blood requests retrieved.",
      data: rows,
      meta: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ── GET ONE ───────────────────────────────────────────────────────────────────

export async function getTransfusionRequestById(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const id = req.params.id as string;

    const request = await BloodTransfusionRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ message: "Blood request not found." });
    }

    return res.status(200).json({ data: request });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ── UPDATE ────────────────────────────────────────────────────────────────────

export async function updateTransfusionRequest(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const id = req.params.id as string;

    const request = await BloodTransfusionRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ message: "Blood request not found." });
    }

    // Allow editing only while still pending and not yet reviewed
    if (request.status !== "PENDING" || request.reviewedAt) {
      return res.status(400).json({
        message: "Only unreviewed PENDING requests can be edited.",
      });
    }

    const {
      firstName, middleName, lastName, age, birthday,
      civilStatus, sex, street, city, province,
      zipCode, mobileNumber, email,
    } = req.body;

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    const newAttachments: string[] = [
      ...(files?.image?.map((f) => f.path) ?? []),
      ...(files?.file?.map((f) => f.path) ?? []),
    ];

    await request.update({
      ...(firstName && { firstName }),
      ...(middleName !== undefined && { middleName: middleName ?? null }),
      ...(lastName && { lastName }),
      ...(age !== undefined && { age }),
      ...(birthday && { birthday: new Date(birthday) }),
      ...(civilStatus && { civilStatus }),
      ...(sex && { sex }),
      ...(street && { street }),
      ...(city && { city }),
      ...(province && { province }),
      ...(zipCode && { zipCode }),
      ...(mobileNumber && { mobileNumber }),
      ...(email && { email }),
      ...(newAttachments.length > 0 && {
        attachments: newAttachments,
        needsReupload: false,   // cleared when patient re-uploads
      }),
    });

    return res.status(200).json({
      message: "Blood request updated.",
      data: request,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ── REVIEW ────────────────────────────────────────────────────────────────────

// export async function reviewTransfusionRequest(
//   req: AuthRequest,
//   res: Response
// ): Promise<Response> {
//   try {
//     const id = req.params.id as string;
//     const { status, blood_type, component, units, remarks } = req.body;

//     const request = await BloodTransfusionRequest.findByPk(id);
//     if (!request) {
//       return res.status(404).json({ message: "Blood request not found." });
//     }

//     const allowedTransitions: Record<string, RequestStatus[]> = {
//       PENDING:   ["APPROVED", "CANCELLED"],
//       APPROVED:  ["FULFILLED", "CANCELLED"],
//       FULFILLED: [],
//       CANCELLED: [],
//     };

//     const allowed = allowedTransitions[request.status] ?? [];

//     if (!allowed.includes(status)) {
//       return res.status(400).json({
//         message: `Cannot transition from ${request.status} to ${status}.`,
//       });
//     }

//     // ── RESTORE INVENTORY IF CANCELLING AN APPROVED REQUEST ───────────────────
//     if (status === "CANCELLED" && request.status === "APPROVED") {
//       const bt   = request.bloodType;
//       const comp = request.component;
//       const u    = request.units;

//       if (bt && comp && u) {
//         try {
//           await restoreInventory(bt, comp, u, (req as any).user?.role);
//         } catch (err) {
//           console.error("Inventory restore failed:", err);
//         }
//       }
//     }

//     // ── PERSIST STATUS + BLOOD DETAILS ────────────────────────────────────────
//     await request.update({
//       status,
//       reviewedById: (req as any).user.id,
//       reviewedAt: new Date(),
//       // When approved, record which blood product was released
//       ...(status === "APPROVED" && {
//         ...(blood_type  && { bloodType: blood_type }),
//         ...(component   && { component }),
//         ...(units !== undefined && { units }),
//         ...(remarks     && { remarks }),
//         needsReupload: false,   // clear any pending flag on approval
//       }),
//     });

//     // ── SMS ON APPROVED ───────────────────────────────────────────────────────
//     if (status === "APPROVED") {
//       try {
//         await sendSMS(
//           request.mobileNumber,
//           smsTemplates.bloodRequestApproved(
//             request.firstName,
//             request.id,
//             request.bloodType ?? blood_type ?? "N/A",
//             request.component ?? component ?? "N/A",
//             request.units     ?? units     ?? 1
//           )
//         );
//       } catch (smsErr) {
//         console.error("❌ SMS ERROR (APPROVED):", smsErr);
//       }
//       }

//     return res.status(200).json({
//       message: `Blood request ${status.toLowerCase()}.`,
//       data: request,
//     });
//   } catch (error) {
//     return res.status(500).json({ message: "Server error.", error });
//   }
// }

// ── CANCEL (client) ───────────────────────────────────────────────────────────

export async function cancelTransfusionRequest(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const id = req.params.id as string;

    const request = await BloodTransfusionRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ message: "Blood request not found." });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        message: "Only PENDING requests can be cancelled by the client.",
      });
    }

    await request.update({ status: "CANCELLED" });

    return res.status(200).json({
      message: "Blood request cancelled.",
      data: request,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ── REQUEST CLEARER IMAGE ─────────────────────────────────────────────────────
// No longer changes status. Sets needsReupload = true and emails the patient.

export async function requestClearerImage(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const id = req.params.id as string;

    const request = await BloodTransfusionRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ message: "Blood request not found." });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        message: "Can only request re-upload for PENDING requests.",
      });
    }

    await request.update({
      needsReupload: true,
      reviewedById: (req as any).user.id,
      reviewedAt: new Date(),
    });

    try {
      await sendClearerImageRequestEmail({
        to: request.email,
        firstName: request.firstName,
        lastName: request.lastName,
        requestId: id,
      });
    } catch (emailErr) {
      console.error("Failed to send clearer image email:", emailErr);
      return res.status(200).json({
        message:
          "Flagged for re-upload but email failed to send. Check mailer config.",
        needsReupload: true,
        emailError: (emailErr as Error).message,
      });
    }

    return res.status(200).json({
      message: "Request flagged for re-upload and email sent to patient.",
      needsReupload: true,
    });
  } catch (error) {
    console.error("requestClearerImage error:", error);
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ── REUPLOAD REFERRAL (client) ────────────────────────────────────────────────
// Patient re-uploads a clearer document.
// Replaces attachments and clears the needsReupload flag. Status stays PENDING.

export async function reuploadReferral(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const id = req.params.id as string;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const request = await BloodTransfusionRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ message: "Blood request not found." });
    }

    if (!request.needsReupload) {
      return res.status(400).json({
        message: "This request is not currently awaiting a re-upload.",
      });
    }

    await request.update({
      attachments: [req.file.path],
      needsReupload: false,    // cleared — back to normal PENDING
      reviewedAt: null,        // reset so admin knows it needs fresh review
    });

    return res.status(200).json({
      message: "Document re-uploaded. Request is ready for admin review.",
      data: request,
    });
  } catch (error) {
    console.error("reuploadReferral error:", error);
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ── NOTIFICATIONS (client) ────────────────────────────────────────────────────

export const getMyBloodRequestNotifications = async (req: any, res: Response) => {
  try {
    const requests = await BloodTransfusionRequest.findAll({
      where: { userId: req.user.id },
      attributes: ["id", "status", "needsReupload", "rejectionReason", "updatedAt"],
      order: [["updatedAt", "DESC"]],
    });

    const notifications = requests.map((r) => {
      let message = "";

      if (r.needsReupload) {
        message =
          "Action required: Please re-upload a clearer copy of your referral document. Check your email for the re-upload link.";
      } else {
        const STATUS_MESSAGES: Record<string, string> = {
          PENDING:   "Your blood request is pending review.",
          APPROVED:  "Great news! Your blood request has been approved. Please coordinate with us for pickup.",
          FULFILLED: "Your blood request has been fulfilled.",
          CANCELLED: "Your blood request has been cancelled.",
        };
        message =
          STATUS_MESSAGES[r.status] ??
          `Your blood transfusion request status is now "${r.status}".`;
      }

      return {
        requestId: r.id,
        title: "Blood Request Update",
        message,
        status: r.status,
        needsReupload: r.needsReupload,
        createdAt: r.updatedAt,
      };
    });

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// ── GET MY REQUESTS (client) ──────────────────────────────────────────────────

export async function getMyTransfusionRequests(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const requests = await BloodTransfusionRequest.findAll({
      where: {
        userId,
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "My blood requests retrieved successfully.",
      data: requests,
    });
  } catch (error: any) {
    console.error("GET MY BLOOD REQUESTS ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch my blood requests.",
      error: error.message,
    });
  }
}