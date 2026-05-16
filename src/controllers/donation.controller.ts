import { Request, Response } from "express";
import { Op } from "sequelize";
import BloodDonationAppointment, {
  AppointmentStatus,
  Sex,
  CivilStatus,
  BloodType,
} from "../models/donation";
import { sendAppointmentConfirmationEmail } from "../utils/email.service";
import { sendSMS } from "../services/smsService";
import { smsTemplates } from "../template/smsTemplates";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const currentUserId = (req: AuthRequest): string => req.user!.id;

// ── CREATE ────────────────────────────────────────────────────────────────────

export async function createDonationAppointment(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const {
      firstName,
      middleName,
      lastName,
      birthday,
      age,
      civilStatus,
      sex,
      street,
      city,
      province,
      zipCode,
      nationality,
      religion,
      education,
      occupation,
      telephoneNumber,
      mobileNumber,
      email,
      bloodType,
      appointmentDate,
      appointmentTime,
      locationAddress,
    }: {
      firstName: string;
      middleName?: string | null;
      lastName: string;
      birthday: string;
      age: number | string;
      civilStatus: CivilStatus;
      sex: Sex;
      street: string;
      city: string;
      province: string;
      zipCode: string;
      nationality?: string | null;
      religion?: string | null;
      education?: string | null;
      occupation?: string | null;
      telephoneNumber?: string | null;
      mobileNumber: string;
      email: string;
      bloodType: BloodType;
      appointmentDate: string;
      appointmentTime: string;
      latitude?: string | null;
      longitude?: string | null;
      locationAddress?: string | null;
    } = req.body;

    // ── Validate required fields ──────────────────────────────────────────
    const missing: string[] = [];
    if (!firstName)       missing.push("firstName");
    if (!lastName)        missing.push("lastName");
    if (!birthday)        missing.push("birthday");
    if (!civilStatus)     missing.push("civilStatus");
    if (!sex)             missing.push("sex");
    if (!street)          missing.push("street");
    if (!city)            missing.push("city");
    if (!province)        missing.push("province");
    if (!zipCode)         missing.push("zipCode");
    if (!mobileNumber)    missing.push("mobileNumber");
    if (!email)           missing.push("email");
    if (!bloodType)       missing.push("bloodType");
    if (!appointmentDate) missing.push("appointmentDate");
    if (!appointmentTime) missing.push("appointmentTime");

    if (missing.length > 0) {
      return res.status(400).json({
        message: "Missing required fields.",
        fields: missing,
      });
    }

    // ── Handle file uploads ───────────────────────────────────────────────
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    const attachments: string[] = [
      ...(files?.image?.map((f) => f.path) ?? []),
      ...(files?.file?.map((f) => f.path) ?? []),
    ];

    const parsedAge = typeof age === "string" ? parseInt(age, 10) : age;

    // ── Persist record ────────────────────────────────────────────────────
    const appointment = await BloodDonationAppointment.create({
      submittedAt: new Date(),
      userId: (req.user as any).id,
      firstName,
      middleName: middleName ?? null,
      lastName,
      birthday: new Date(birthday),
      age: parsedAge,
      civilStatus,
      sex,
      street,
      city,
      province,
      zipCode,
      nationality: nationality || null,
      religion: religion || null,
      education: education || null,
      occupation: occupation || null,
      telephoneNumber: telephoneNumber || null,
      mobileNumber,
      email,
      bloodType,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      locationAddress: locationAddress ?? null,
      attachments,
      status: "APPROVED",
    });

    // ── Send confirmation email ───────────────────────────────────────────
    try {
      await sendAppointmentConfirmationEmail({
        to: email,
        firstName,
        appointmentDate,
        appointmentTime,
      });
    } catch (emailErr) {
      console.error("❌ EMAIL ERROR:", emailErr);
    }

    // ── Send confirmation SMS to donor ────────────────────────────────────
    try {
      const formattedDate = new Date(appointmentDate).toLocaleDateString("en-PH", {
        year: "numeric", month: "long", day: "numeric",
      });
      await sendSMS(
        mobileNumber,
        smsTemplates.donationSuccess(firstName, formattedDate, locationAddress ?? "our blood bank")
      );
    } catch (smsErr) {
      console.error("❌ SMS ERROR:", smsErr);
    }

    return res.status(201).json({
      message: "Donation appointment submitted successfully.",
      data: appointment,
    });
  } catch (error) {
    console.error("createDonationAppointment error:", error);
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ── GET ALL ───────────────────────────────────────────────────────────────────

export async function getAllDonationAppointments(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const {
      status,
      bloodType,
      from,
      to,
      page = "1",
      limit = "20",
    } = req.query as Record<string, string>;

    const where: Record<string, any> = {};

    if (status) where.status = status;
    if (bloodType) where.bloodType = bloodType;

    if (from || to) {
      where.appointmentDate = {};
      if (from) where.appointmentDate[Op.gte] = new Date(from);
      if (to) where.appointmentDate[Op.lte] = new Date(to);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await BloodDonationAppointment.findAndCountAll({
      where,
      order: [["appointmentDate", "ASC"]],
      limit: limitNum,
      offset,
    });

    return res.status(200).json({
      message: "Donation appointments retrieved.",
      data: rows,
      meta: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    console.error("getAllDonationAppointments error:", error);
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ── GET ONE ───────────────────────────────────────────────────────────────────

export async function getDonationAppointmentById(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const id = req.params.id as string;

    const appointment = await BloodDonationAppointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    return res.status(200).json({ data: appointment });
  } catch (error) {
    console.error("getDonationAppointmentById error:", error);
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ── UPDATE (RESCHEDULE) ───────────────────────────────────────────────────────

export async function updateDonationAppointment(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const id = req.params.id as string;

    const appointment = await BloodDonationAppointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (appointment.status === "CANCELLED" || appointment.status === "FULFILLED") {
      return res.status(400).json({
        message: "Cannot reschedule a cancelled or fulfilled appointment.",
      });
    }

    const {
      firstName,
      middleName,
      lastName,
      birthday,
      age,
      civilStatus,
      sex,
      street,
      city,
      province,
      zipCode,
      nationality,
      religion,
      education,
      occupation,
      telephoneNumber,
      mobileNumber,
      email,
      bloodType,
      appointmentDate,
      appointmentTime,
      locationAddress,
      rescheduledBy,
    } = req.body;

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    const newAttachments: string[] = [
      ...(files?.image?.map((f) => f.path) ?? []),
      ...(files?.file?.map((f) => f.path) ?? []),
    ];

    const parsedAge = age !== undefined
      ? (typeof age === "string" ? parseInt(age, 10) : age)
      : undefined;

    const oldDate = appointment.appointmentDate;

    await appointment.update({
      ...(firstName && { firstName }),
      ...(middleName !== undefined && { middleName: middleName ?? null }),
      ...(lastName && { lastName }),
      ...(birthday && { birthday: new Date(birthday) }),
      ...(parsedAge !== undefined && { age: parsedAge }),
      ...(civilStatus && { civilStatus }),
      ...(sex && { sex }),
      ...(street && { street }),
      ...(city !== undefined && { city: city || null }),
      ...(province !== undefined && { province: province || null }),
      ...(zipCode && { zipCode }),
      ...(nationality !== undefined && { nationality: nationality || null }),
      ...(religion !== undefined && { religion: religion || null }),
      ...(education !== undefined && { education: education || null }),
      ...(occupation !== undefined && { occupation: occupation || null }),
      ...(telephoneNumber !== undefined && { telephoneNumber: telephoneNumber || null }),
      ...(mobileNumber && { mobileNumber }),
      ...(email && { email }),
      ...(bloodType && { bloodType }),
      ...(appointmentDate && { appointmentDate: new Date(appointmentDate) }),
      ...(appointmentTime && { appointmentTime }),
      ...(locationAddress !== undefined && { locationAddress: locationAddress || null }),
      ...(newAttachments.length > 0 && { attachments: newAttachments }),
    });

    // ── Send reschedule SMS if appointment date changed ───────────────────
    if (appointmentDate) {
      try {
        const fmt = (d: Date | string) =>
          new Date(d).toLocaleDateString("en-PH", {
            year: "numeric", month: "long", day: "numeric",
          });

        const recipientPhone = mobileNumber || appointment.mobileNumber;
        const recipientName  = firstName    || appointment.firstName;
        const newLocation    = locationAddress ?? appointment.locationAddress ?? "our blood bank";

        await sendSMS(
          recipientPhone,
          smsTemplates.donationRescheduled(
            recipientName,
            fmt(oldDate),
            fmt(appointmentDate),
            newLocation,
            rescheduledBy ?? "Admin"
          )
        );
      } catch (smsErr) {
        console.error("❌ SMS ERROR:", smsErr);
      }
    }

    return res.status(200).json({
      message: "Appointment updated.",
      data: appointment,
    });
  } catch (error) {
    console.error("updateDonationAppointment error:", error);
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ── REVIEW ────────────────────────────────────────────────────────────────────

export async function reviewDonationAppointment(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const id = req.params.id as string;
    const { status: rawStatus, reviewNotes } = req.body;
    const status = rawStatus as AppointmentStatus;

    const appointment = await BloodDonationAppointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (
      appointment.status === "CANCELLED" ||
      appointment.status === "FULFILLED"
    ) {
      return res.status(400).json({
        message: `Cannot review a ${appointment.status} appointment.`,
      });
    }

    await appointment.update({
      status,
      reviewNotes: reviewNotes ?? null,
      reviewedById: currentUserId(req),
      reviewedAt: new Date(),
    });

    // ── Send SMS on FULFILLED ─────────────────────────────────────────────
    if ((status as string) === "FULFILLED") {
      try {
        const formattedDate = new Date(appointment.appointmentDate).toLocaleDateString("en-PH", {
          year: "numeric", month: "long", day: "numeric",
        });
        await sendSMS(
          appointment.mobileNumber,
          smsTemplates.donationSuccess(
            appointment.firstName,
            formattedDate,
            appointment.locationAddress ?? "our blood bank"
          )
        );
      } catch (smsErr) {
        console.error("❌ SMS ERROR:", smsErr);
      }
    }

    // ── Send SMS on REJECTED ──────────────────────────────────────────────
    if ((status as string) === "REJECTED") {
      try {
        await sendSMS(
          appointment.mobileNumber,
          smsTemplates.donationRejected(
            appointment.firstName,
            reviewNotes ?? "Please contact us for more details."
          )
        );
      } catch (smsErr) {
        console.error("❌ SMS ERROR:", smsErr);
      }
    }

    return res.status(200).json({
      message: `Appointment ${status.toLowerCase()}.`,
      data: appointment,
    });
  } catch (error) {
    console.error("reviewDonationAppointment error:", error);
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ── CANCEL ────────────────────────────────────────────────────────────────────

export async function cancelDonationAppointment(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const id = req.params.id as string;

    const appointment = await BloodDonationAppointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (appointment.status === "CANCELLED" || appointment.status === "FULFILLED") {
      return res.status(400).json({
        message: "Appointment is already cancelled or fulfilled.",
      });
    }

    const { reason } = req.body;

    await appointment.update({
      status: "CANCELLED",
      cancelReason: reason ?? null,
    });

    return res.status(200).json({
      message: "Appointment cancelled.",
      data: appointment,
    });
  } catch (error) {
    console.error("cancelDonationAppointment error:", error);
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ── GET MY DONATION NOTIFICATIONS ─────────────────────────────────────────────

export const getMyDonationNotifications = async (req: any, res: Response) => {
  try {
    const appointments = await BloodDonationAppointment.findAll({
      where: { userId: req.user.id },
      attributes: ["id", "status", "reviewNotes", "updatedAt"],
      order: [["updatedAt", "DESC"]],
    });

    const notifications = appointments.map((a) => ({
      appointmentId: a.id,
      title: "Donation Appointment Update",
      message: `Your donation appointment status is now "${a.status}".`,
      status: a.status,
      note: a.status === "CANCELLED" ? a.reviewNotes : undefined,
      createdAt: a.updatedAt,
    }));

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export const getMyDonationAppointments = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const donations = await BloodDonationAppointment.findAll({
      where: {
        userId,
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "My donation appointments fetched successfully",
      data: donations,
    });
  } catch (error: any) {
    console.error("GET MY DONATIONS ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch my donation appointments",
      error: error.message,
    });
  }
};