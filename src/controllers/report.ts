import { Request, Response } from "express";
import { Op, WhereOptions } from "sequelize";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";

import BloodDonationAppointment from "../models/donation";
import BloodTransfusionRequest from "../models/bloodRequest";
import Inventory from "../models/inventory.bloodbank";
import BloodBank from "../models/bloodbank"; // ← to look up facilityNo by id

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

type ReportType = "donations" | "transfusions" | "inventory";

interface ReportQuery {
  reportType: ReportType;
  startDate: string;
  endDate: string;
  bloodBankId?: string;
  exportFormat?: "json" | "csv" | "pdf";
}

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

function dateRange(field: string, start: string, end: string) {
  return {
    [field]: {
      [Op.between]: [
        new Date(`${start}T00:00:00.000Z`),
        new Date(`${end}T23:59:59.999Z`),
      ],
    },
  };
}

function parseQuery(query: Request["query"]): ReportQuery | null {
  const { reportType, startDate, endDate, bloodBankId, exportFormat } = query;

  if (!reportType || !startDate || !endDate) return null;
  if (!["donations", "transfusions", "inventory"].includes(reportType as string))
    return null;

  return {
    reportType: reportType as ReportType,
    startDate: startDate as string,
    endDate: endDate as string,
    bloodBankId: bloodBankId as string | undefined,
    exportFormat: (exportFormat as ReportQuery["exportFormat"]) ?? "json",
  };
}

/* ─────────────────────────────────────────────────────────────
   DATA FETCHERS
───────────────────────────────────────────────────────────── */

async function fetchDonations(
  start: string,
  end: string,
  bloodBankId?: string  // maps to requestToId
) {
  const where: WhereOptions = {
    ...dateRange("appointmentDate", start, end),
    ...(bloodBankId ? { requestToId: bloodBankId } : {}),
  };

  const rows = await BloodDonationAppointment.findAll({
    where,
    order: [["appointmentDate", "ASC"]],
  });

  return rows.map((r) => ({
    id: r.id,
    requestToId: r.requestToId,
    appointmentDate: r.appointmentDate,
    appointmentTime: r.appointmentTime,
    status: r.status,
    firstName: r.firstName,
    middleName: r.middleName ?? "",
    lastName: r.lastName,
    age: r.age,
    birthday: r.birthday,
    sex: r.sex,
    civilStatus: r.civilStatus,
    bloodType: r.bloodType,
    mobileNumber: r.mobileNumber,
    email: r.email,
    street: r.street,
    city: r.city,
    province: r.province,
    zipCode: r.zipCode,
    nationality: r.nationality ?? "",
    religion: r.religion ?? "",
    education: r.education ?? "",
    occupation: r.occupation ?? "",
    reviewNotes: r.reviewNotes ?? "",
    cancelReason: r.cancelReason ?? "",
    submittedAt: r.submittedAt,
  }));
}

async function fetchTransfusions(
  start: string,
  end: string,
  bloodBankId?: string  // maps to requestToId
) {
  const where: WhereOptions = {
    ...dateRange("date", start, end),
    ...(bloodBankId ? { requestToId: bloodBankId } : {}),
  };

  const rows = await BloodTransfusionRequest.findAll({
    where,
    order: [["date", "ASC"]],
  });

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    requestToId: r.requestToId,
    date: r.date,
    status: r.status,
    needsReupload: r.needsReupload,
    firstName: r.firstName,
    middleName: r.middleName ?? "",
    lastName: r.lastName,
    age: r.age,
    birthday: r.birthday,
    sex: r.sex,
    civilStatus: r.civilStatus,
    mobileNumber: r.mobileNumber,
    email: r.email,
    street: r.street,
    city: r.city,
    province: r.province,
    zipCode: r.zipCode,
    bloodId: r.bloodId ?? "",
    bloodType: r.bloodType ?? "",
    component: r.component ?? "",
    units: r.units ?? "",
    remarks: r.remarks ?? "",
    rejectionReason: r.rejectionReason ?? "",
    reviewedAt: r.reviewedAt ?? "",
  }));
}

async function fetchInventory(
  start: string,
  end: string,
  facilityNo?: string  // maps to inventory.facilityNo
) {
  const where: WhereOptions = {
    ...dateRange("date_of_produce", start, end),
    ...(facilityNo ? { facilityNo } : {}),
  };

  const rows = await Inventory.findAll({
    where,
    order: [["dateOfProduce", "ASC"]],
  });

  return rows.map((r) => ({
    id: r.id,
    bloodId: r.bloodId,
    facilityNo: r.facilityNo,
    year: r.year,
    serialNo: r.serialNo,
    dateOfProduce: r.dateOfProduce,
    produceTime: r.produceTime,
    expiration: r.expiration,
    bloodType: r.bloodType,
    component: r.component,
    source: r.source,
    status: r.status,
    units: r.units,
  }));
}

/* ─────────────────────────────────────────────────────────────
   EXPORT HELPERS
───────────────────────────────────────────────────────────── */
function addSignatureBlock(doc: PDFKit.PDFDocument) {
  const blockHeight = 90;
  const marginLeft = 40;
  const lineWidth = 220;

  if (doc.y + blockHeight > doc.page.height - 40) {
    doc.addPage();
  }

  const y = doc.page.height - 40 - blockHeight;

  doc.fontSize(9).font("Helvetica").text("Prepared by:", marginLeft, y);

  const lineY = y + 40;
  doc
    .moveTo(marginLeft, lineY)
    .lineTo(marginLeft + lineWidth, lineY)
    .stroke();

  doc
    .fontSize(8)
    .font("Helvetica")
    .text("Signature over Printed Name", marginLeft, lineY + 4, {
      width: lineWidth,
      align: "center",
    });
}


function sendCSV(res: Response, data: object[], filename: string) {
  if (data.length === 0) {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
    return res.send("");
  }

  const parser = new Parser({ fields: Object.keys(data[0]) });
  const csv = parser.parse(data);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
  res.send(csv);
}

function sendPDF(
  res: Response,
  data: object[],
  filename: string,
  title: string,
  startDate: string,
  endDate: string,
  bloodBankName?: string
) {
  const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
  doc.pipe(res);

  doc.fontSize(16).font("Helvetica-Bold").text(title, { align: "center" });
  
  if (bloodBankName) {
    doc.fontSize(12).font("Helvetica-Bold").text(bloodBankName, { align: "center" });
  }

  doc.fontSize(10).font("Helvetica").text(`Date Range: ${startDate} to ${endDate}`, { align: "center" });
  doc.fontSize(9).text(`Generated: ${new Date().toLocaleString()}`, { align: "center" }).moveDown(1);

  if (data.length === 0) {
    doc.fontSize(11).text("No records found for the selected filters.", { align: "center" });
    addSignatureBlock(doc);
    doc.end();
    return;
  }

  const columns = Object.keys(data[0]);
  const pageWidth = doc.page.width - 80;
  const colWidth = Math.max(60, Math.floor(pageWidth / Math.min(columns.length, 10)));
  const visibleCols = columns.slice(0, Math.floor(pageWidth / colWidth));
  const rowHeight = 18;
  let y = doc.y;

  doc.font("Helvetica-Bold").fontSize(7);
  visibleCols.forEach((col, i) => {
    doc.text(col.toUpperCase(), 40 + i * colWidth, y, {
      width: colWidth - 4,
      ellipsis: true,
      lineBreak: false,
    });
  });

  y += rowHeight;
  doc.moveTo(40, y - 4).lineTo(40 + visibleCols.length * colWidth, y - 4).stroke();

  doc.font("Helvetica").fontSize(7);
  data.forEach((row, rowIdx) => {
    if (y + rowHeight > doc.page.height - 40) {
      doc.addPage();
      y = 40;
    }

    const bg = rowIdx % 2 === 0 ? "#f9f9f9" : "#ffffff";
    doc.rect(40, y - 2, visibleCols.length * colWidth, rowHeight - 2).fill(bg);
    doc.fillColor("#000000");

    visibleCols.forEach((col, i) => {
      const val = String((row as Record<string, unknown>)[col] ?? "");
      doc.text(val, 40 + i * colWidth, y, {
        width: colWidth - 4,
        ellipsis: true,
        lineBreak: false,
      });
    });

    y += rowHeight;
  });

  addSignatureBlock(doc);
  doc.end();
}

/* ─────────────────────────────────────────────────────────────
   BLOOD BANK CONTROLLER
   - req.user.id  = blood bank UUID (same as requestToId)
   - facilityNo   = looked up from BloodBank model using that id
───────────────────────────────────────────────────────────── */

export async function generateBloodBankReport(req: Request, res: Response) {
  try {
    const params = parseQuery(req.query);
    if (!params) {
      return res.status(400).json({
        message:
          "Missing or invalid query params. Required: reportType, startDate, endDate. " +
          "reportType must be one of: donations | transfusions | inventory.",
      });
    }

    const { reportType, startDate, endDate, exportFormat } = params;

    // req.user.id is the userId on the blood_banks table — use it to find the blood bank record
    const userId: string = (req as any).user?.id;

    if (!userId) {
      return res.status(403).json({ message: "Blood bank identity not found on token." });
    }

    // Look up the blood bank by userId to get its actual id and facilityNo
    const bloodBank = await BloodBank.findOne({ where: { userId } });
    if (!bloodBank) {
      return res.status(404).json({ message: "Blood bank record not found for this user." });
    }

    let data: object[] = [];
    let reportTitle = "";

    if (reportType === "donations") {
      // bloodBank.id matches requestToId in donations/transfusions
      data = await fetchDonations(startDate, endDate, bloodBank.id);
      reportTitle = "Blood Donation Appointments Report";

    } else if (reportType === "transfusions") {
      data = await fetchTransfusions(startDate, endDate, bloodBank.id);
      reportTitle = "Blood Transfusion Requests Report";

    } else {
      // inventory uses facilityNo
      if (!bloodBank.facilityNo) {
        return res.status(400).json({ message: "This blood bank has no facility number assigned." });
      }
      data = await fetchInventory(startDate, endDate, bloodBank.facilityNo);
      reportTitle = "Blood Inventory Report";
    }

    const filename = `${reportType}_${startDate}_${endDate}`;

    if (exportFormat === "csv") return sendCSV(res, data, filename);
    if (exportFormat === "pdf") return sendPDF(res, data, filename, reportTitle, startDate, endDate, bloodBank.hospitalName);

    return res.status(200).json({
      reportType,
      startDate,
      endDate,
      totalRecords: data.length,
      data,
    });
  } catch (err) {
    console.error("[generateBloodBankReport]", err);
    return res.status(500).json({ message: "Failed to generate report.", error: err });
  }
}

/* ─────────────────────────────────────────────────────────────
   SUPER ADMIN CONTROLLER
   - bloodBankId "all" or specific UUID → donations & transfusions
   - facilityNo  "all" or specific string → inventory
     (if bloodBankId is passed for inventory, look up its facilityNo)
───────────────────────────────────────────────────────────── */

export async function generateAdminReport(req: Request, res: Response) {
  try {
    const params = parseQuery(req.query);
    if (!params) {
      return res.status(400).json({
        message:
          "Missing or invalid query params. Required: reportType, startDate, endDate. " +
          "reportType must be one of: donations | transfusions | inventory.",
      });
    }

    const { reportType, startDate, endDate, exportFormat } = params;

    const bloodBankId = (req.query.bloodBankId as string) ?? "all";

    let selectedBloodBank: BloodBank | null = null;
    if (bloodBankId !== "all") {
      selectedBloodBank = await BloodBank.findByPk(bloodBankId);
      if (!selectedBloodBank) {
        return res.status(404).json({ message: "Blood bank not found." });
      }
    }

    let data: object[] = [];
    let reportTitle = "";
    let scopeLabel = "";

    if (reportType === "donations") {
      data = await fetchDonations(
        startDate, endDate,
        bloodBankId === "all" ? undefined : bloodBankId
      );
      reportTitle = "Blood Donation Appointments Report";
      scopeLabel  = selectedBloodBank ? selectedBloodBank.hospitalName : "All Blood Banks";

    } else if (reportType === "transfusions") {
      data = await fetchTransfusions(
        startDate, endDate,
        bloodBankId === "all" ? undefined : bloodBankId
      );
      reportTitle = "Blood Transfusion Requests Report";
      scopeLabel  = selectedBloodBank ? selectedBloodBank.hospitalName : "All Blood Banks";

    } else {
      // inventory uses facilityNo, resolved from the same selectedBloodBank lookup
      const facilityNo = selectedBloodBank?.facilityNo ?? undefined;

      if (bloodBankId !== "all" && !facilityNo) {
        return res.status(400).json({ message: "This blood bank has no facility number assigned." });
      }

      data = await fetchInventory(startDate, endDate, facilityNo);
      reportTitle = "Blood Inventory Report";
      scopeLabel  = selectedBloodBank ? selectedBloodBank.hospitalName : "All Facilities";
    }

    const filename = `admin_${reportType}_${startDate}_${endDate}`;

    if (exportFormat === "csv") return sendCSV(res, data, filename);
    if (exportFormat === "pdf")
      return sendPDF(res, data, filename, reportTitle, startDate, endDate, scopeLabel);

    return res.status(200).json({
      reportType,
      startDate,
      endDate,
      scope: scopeLabel,
      totalRecords: data.length,
      data,
    });
  } catch (err) {
    console.error("[generateAdminReport]", err);
    return res.status(500).json({ message: "Failed to generate report.", error: err });
  }
}