import { Request, Response } from "express";
import { Op } from "sequelize";
import { resolveInventoryModel } from "../helpers/resolveInventoryModel";
import BloodBank from "../models/bloodbank";
import { SourceType, InventoryStatus } from "../models/inventory.bloodbank";

// ─────────────────────────────────────────────
// EXPIRY RULES
// ─────────────────────────────────────────────
const EXPIRY_DAYS: Record<string, number> = {
  "Whole Blood": 35,
  "Packed RBC": 42,
  "Washed RBC": 1,
  "Buffy Coat-Poor RBC": 42,
  "Platelet Concentrate": 5,
  "Apheresis Platelets": 5,
  "Leukocyte-Poor Platelet Concentrate": 5,
  "Fresh Frozen Plasma": 365,
  "Leukocyte-Poor FFP": 365,
  "Cryoprecipitate": 365,
};

// ─────────────────────────────────────────────
// ALL COMPONENTS
// ─────────────────────────────────────────────
const ALL_COMPONENTS = [
  "Whole Blood",
  "Packed RBC",
  "Washed RBC",
  "Buffy Coat-Poor RBC",
  "Platelet Concentrate",
  "Apheresis Platelets",
  "Leukocyte-Poor Platelet Concentrate",
  "Fresh Frozen Plasma",
  "Leukocyte-Poor FFP",
  "Cryoprecipitate",
];

// ─────────────────────────────────────────────
// BLOOD ID LOOKUP MAPS
// ─────────────────────────────────────────────

/** Component code — zero-padded 2 digits */
const COMPONENT_CODE: Record<string, string> = {
  "Whole Blood":                        "01",
  "Packed RBC":                         "02",
  "Washed RBC":                         "03",
  "Buffy Coat-Poor RBC":                "04",
  "Platelet Concentrate":               "05",
  "Apheresis Platelets":                "06",
  "Leukocyte-Poor Platelet Concentrate":"07",
  "Fresh Frozen Plasma":                "08",
  "Leukocyte-Poor FFP":                 "09",
  "Cryoprecipitate":                    "10",
};

/** Blood type code — single digit */
const BLOOD_TYPE_CODE: Record<string, string> = {
  "A+":  "1",
  "A-":  "2",
  "B+":  "3",
  "B-":  "4",
  "AB+": "5",
  "AB-": "6",
  "O+":  "7",
  "O-":  "8",
};

/** Source code — single digit */
const SOURCE_CODE: Record<SourceType, string> = {
  "walk-in":    "1",
  "appointment": "2",
  "admin":       "3",
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function calcExpiry(dateOfProduce: string, component: string): Date {
  const base = new Date(dateOfProduce);
  const days = EXPIRY_DAYS[component];
  if (!days) throw new Error(`Unknown component: ${component}`);
  base.setDate(base.getDate() + days);
  return base;
}

const toStr = (val: string | string[] | undefined): string | undefined => {
  if (!val) return undefined;
  return Array.isArray(val) ? val[0] : val;
};

/**
 * Format expiry date as MMDDYY
 * e.g. July 13 2026 → "071326"
 */
function formatExpirySegment(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${mm}${dd}${yy}`;
}

/**
 * Generate the next serial number scoped to:
 *   facility + bloodType + component
 *
 * Counts existing records with that combo, then increments.
 * Returns zero-padded 4-digit string e.g. "0001".
 */
async function generateScopedSerial(
  Model: any,
  facilityNo: string,
  bloodType: string,
  component: string
): Promise<string> {
  const count = await Model.count({
    where: { facilityNo, bloodType, component },
  });
  return String(count + 1).padStart(4, "0");
}

/**
 * Build the blood ID string from its parts.
 *
 * Format: {facilityNo}-{serialNo}{componentCode}{bloodTypeCode}{expiryMMDDYY}{sourceCode}
 * Example: fac-001-00010180713261
 */
function buildBloodId(
  facilityNo: string,
  serialNo: string,  
  component: string,
  bloodType: string,
  expiration: Date,
  source: SourceType
): string {
  const compCode   = COMPONENT_CODE[component];
  const btCode     = BLOOD_TYPE_CODE[bloodType];
  const expiryCode = formatExpirySegment(expiration);
  const srcCode    = SOURCE_CODE[source];

  if (!compCode)   throw new Error(`No component code for: ${component}`);
  if (!btCode)     throw new Error(`No blood type code for: ${bloodType}`);
  if (!srcCode)    throw new Error(`No source code for: ${source}`);

  return `${facilityNo}-${serialNo}${compCode}${btCode}${expiryCode}${srcCode}`;
}

// ─────────────────────────────────────────────
// CREATE  (one DB row per unit bag)
// ─────────────────────────────────────────────
export async function createInventory(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    console.log("🔍 USER FROM TOKEN:", (req as any).user);
    const role   = (req as any).user?.role;
    const userId = (req as any).user?.id;
    console.log("🔍 ROLE:", role);

    const Model = resolveInventoryModel(role);

    const {
      year,
      dateOfProduce,
      bloodType,
      component,
      units,
      status,
    }: {
      year: number;
      dateOfProduce: string;
      bloodType: string;
      component: string;
      units: number;
      status: InventoryStatus;
    } = req.body;

    if (!["available", "used", "expired", "disposed"].includes(status)) {
      return res.status(400).json({
        message: `Invalid status: ${status}`,
      });
    }

    // Resolve source: body > role default
    const sourceRaw: string =
      req.body.source ??
      (role === "admin" ? "admin" : "walk-in");

    if (!["walk-in", "appointment", "admin"].includes(sourceRaw)) {
      return res.status(400).json({ message: `Invalid source: ${sourceRaw}` });
    }
    const source = sourceRaw as SourceType;

    // ── Resolve facilityNo ──────────────────────
    let facilityNo: string;
    if (role === "blood_bank") {
      const bloodBank = await BloodBank.findOne({ where: { userId } });
      if (!bloodBank?.facilityNo) {
        return res.status(400).json({
          message: "No facility number found for this blood bank account.",
        });
      }
      facilityNo = bloodBank.facilityNo;
    } else {
      facilityNo = req.body.facilityNo;
      if (!facilityNo) {
        return res.status(400).json({ message: "facilityNo is required." });
      }
    }

    if (!ALL_COMPONENTS.includes(component)) {
      return res.status(400).json({ message: `Invalid component: ${component}` });
    }

    const expiration = calcExpiry(dateOfProduce, component);

    // ── Create one row per unit (each bag gets its own bloodId) ──
    const createdEntries: any[] = [];

    for (let i = 0; i < units; i++) {
      // Serial is scoped to facility + bloodType + component.
      // Re-query each iteration so concurrent inserts don't clash.
      const serialNo = await generateScopedSerial(
        Model,
        facilityNo,
        bloodType,
        component
      );

      const bloodId = buildBloodId(
        facilityNo,
        serialNo,
        component,
        bloodType,
        expiration,
        source
      );

      const entry = await Model.create({
        facilityNo,
        year,
        serialNo,
        bloodId,
        dateOfProduce: new Date(dateOfProduce),
        expiration,
        bloodType: bloodType as any,
        component: component as any,
        source,
        status,
        units: 1,          // every row = 1 bag
      });

      createdEntries.push(entry);
    }

    return res.status(201).json({
      message: `${units} inventory bag(s) created successfully.`,
      data: createdEntries,
    });
  } catch (error: any) {
    console.error("CREATE INVENTORY ERROR:", error?.message, error?.original);
    return res.status(500).json({ message: "Server error.", error: error?.message });
  }
}

// ─────────────────────────────────────────────
// CREATE INVENTORY (ADMIN ONLY ENTRY POINT)
// ─────────────────────────────────────────────
export async function createInventoryAdmin(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const role = (req as any).user?.role;

    if (role !== "admin") {
      return res.status(403).json({
        message: "Only admin can access this endpoint.",
      });
    }

    const { facilityNo } = req.body;

    if (!facilityNo) {
      return res.status(400).json({
        message: "facilityNo is required for admin inventory creation.",
      });
    }

    // 🔥 FORCE facilityNo into request so core logic uses it
    (req as any).body.facilityNo = facilityNo;

    // optional safety: ensure admin source
    (req as any).body.source = "admin";

    return createInventory(req, res);
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error.",
      error: error?.message,
    });
  }
}

// ─────────────────────────────────────────────
// GET ALL
// ─────────────────────────────────────────────
export async function getAllInventory(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const role   = (req as any).user?.role;
    const userId = (req as any).user?.id;
    const Model  = resolveInventoryModel(role);

    const bloodType  = toStr(req.query.bloodType as string | string[] | undefined);
    const component  = toStr(req.query.component as string | string[] | undefined);
    const from       = toStr(req.query.from      as string | string[] | undefined);
    const to         = toStr(req.query.to        as string | string[] | undefined);
    const source     = toStr(req.query.source    as string | string[] | undefined);
    const pageNum    = Math.max(1, parseInt(toStr(req.query.page  as string | string[] | undefined) ?? "1",  10));
    const limitNum   = Math.min(100, Math.max(1, parseInt(toStr(req.query.limit as string | string[] | undefined) ?? "20", 10)));

    const where: Record<string, any> = {};

    if (role === "blood_bank") {
      const bloodBank = await BloodBank.findOne({ where: { id: userId } });
      if (!bloodBank?.facilityNo) {
        return res.status(400).json({ message: "No facility found for this account." });
      }
      where.facilityNo = bloodBank.facilityNo;
    } else if (req.query.facilityNo) {
      where.facilityNo = req.query.facilityNo;
    }

    if (bloodType) where.bloodType = bloodType;
    if (component) where.component = component;
    if (source)    where.source    = source;

    if (from || to) {
      where.dateOfProduce = {};
      if (from) where.dateOfProduce[Op.gte] = new Date(from);
      if (to)   where.dateOfProduce[Op.lte] = new Date(to);
    }

    const { count, rows } = await Model.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });

    return res.status(200).json({
      message: "Inventory retrieved.",
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

// ─────────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────────
export async function getInventoryById(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const role  = (req as any).user?.role;
    const Model = resolveInventoryModel(role);

    const id = toStr(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid ID." });

    const entry = await Model.findByPk(id);
    if (!entry)  return res.status(404).json({ message: "Inventory entry not found." });

    return res.status(200).json({ data: entry });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ─────────────────────────────────────────────
// GET BY BLOOD ID
// ─────────────────────────────────────────────
export async function getInventoryByBloodId(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const role  = (req as any).user?.role;
    const Model = resolveInventoryModel(role);

    const bloodId = toStr(req.params.bloodId);
    if (!bloodId) return res.status(400).json({ message: "Invalid blood ID." });

    const entry = await Model.findOne({ where: { bloodId } });
    if (!entry)  return res.status(404).json({ message: "Blood unit not found." });

    return res.status(200).json({ data: entry });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ─────────────────────────────────────────────
// GET SUMMARY
// ─────────────────────────────────────────────
export async function getInventorySummary(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const role   = (req as any).user?.role;
    const userId = (req as any).user?.id;
    const Model  = resolveInventoryModel(role);

    const where: Record<string, any> = {};

    if (role === "blood_bank") {
      const bloodBank = await BloodBank.findOne({ where: { id: userId } });
      if (!bloodBank?.facilityNo) {
        return res.status(400).json({
          message: "No facility number found for this blood bank account.",
        });
      }
      where.facilityNo = bloodBank.facilityNo;
    } else if (req.query.facilityNo) {
      where.facilityNo = req.query.facilityNo;
    }

    const allEntries = await Model.findAll({ where });

    const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const summary: Record<string, any> = {};

    bloodTypes.forEach((bt) => {
      summary[bt] = {
        type: bt,
        // units now = count of rows (each row = 1 bag)
        units: 0,
        components: Object.fromEntries(ALL_COMPONENTS.map((c) => [c, 0])),
      };
    });

    allEntries.forEach((entry: any) => {
      const bt = entry.bloodType;
      if (!summary[bt]) return;
      summary[bt].units += entry.units;  // units is always 1 per row
      if (summary[bt].components[entry.component] !== undefined) {
        summary[bt].components[entry.component] += entry.units;
      }
    });

    return res.status(200).json({
      message: "Inventory summary retrieved.",
      data: Object.values(summary),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────
export async function updateInventory(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const role  = (req as any).user?.role;
    const Model = resolveInventoryModel(role);

    const id = toStr(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid ID." });

    const entry = await Model.findByPk(id) as any;
    if (!entry) return res.status(404).json({ message: "Inventory entry not found." });

    const { dateOfProduce, component, source } = req.body;

    if (component && !ALL_COMPONENTS.includes(component)) {
      return res.status(400).json({ message: `Invalid component: ${component}` });
    }

    if (source && !["walk-in", "appointment", "admin"].includes(source)) {
      return res.status(400).json({ message: `Invalid source: ${source}` });
    }

    const resolvedComponent   = component   ?? entry.component;
    const resolvedDateOfProd  = dateOfProduce ?? entry.dateOfProduce;
    const resolvedSource      = (source as SourceType) ?? entry.source;

    const newExpiration = (dateOfProduce || component)
      ? calcExpiry(
          typeof resolvedDateOfProd === "string"
            ? resolvedDateOfProd
            : resolvedDateOfProd.toISOString().split("T")[0],
          resolvedComponent
        )
      : entry.expiration;

    // Rebuild bloodId if any of its segments changed
    const newBloodId = (dateOfProduce || component || source)
      ? buildBloodId(
          entry.facilityNo,
          entry.serialNo,
          resolvedComponent,
          entry.bloodType,
          newExpiration,
          resolvedSource
        )
      : entry.bloodId;

    await entry.update({
      ...(dateOfProduce && { dateOfProduce: new Date(dateOfProduce) }),
      expiration: newExpiration,
      component:  resolvedComponent,
      source:     resolvedSource,
      bloodId:    newBloodId,
    });

    return res.status(200).json({
      message: "Inventory entry updated.",
      data: entry,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────
export async function deleteInventory(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const role  = (req as any).user?.role;
    const Model = resolveInventoryModel(role);

    const id = toStr(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid ID." });

    const entry = await Model.findByPk(id);
    if (!entry) return res.status(404).json({ message: "Inventory entry not found." });

    await entry.destroy();

    return res.status(200).json({ message: "Inventory entry deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ─────────────────────────────────────────────
// DECREASE INVENTORY  (FIFO — removes whole rows)
// ─────────────────────────────────────────────
export async function decreaseInventory(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const role   = (req as any).user?.role;
    const userId = (req as any).user?.id;
    const Model  = resolveInventoryModel(role);

    const bloodType    = toStr(req.body.blood_type ?? req.body.bloodType);
    const componentRaw = toStr(req.body.component);
    const units        = Number(req.body.units);

    if (!bloodType || !componentRaw || !units || units <= 0) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (!ALL_COMPONENTS.includes(componentRaw)) {
      return res.status(400).json({ message: `Invalid component: ${componentRaw}` });
    }

    const where: Record<string, any> = {
      bloodType,
      component: componentRaw,
    };

    if (role === "blood_bank") {
      const bloodBank = await BloodBank.findOne({ where: { id: userId } });
      if (!bloodBank?.facilityNo) {
        return res.status(400).json({ message: "No facility found for this account." });
      }
      where.facilityNo = bloodBank.facilityNo;
    }

    // Each row = 1 unit bag; FIFO by dateOfProduce
    const entries = await Model.findAll({
      where,
      order: [["dateOfProduce", "ASC"]],
      limit: units,   // we only need `units` rows at most
    }) as any[];

    if (entries.length < units) {
      return res.status(400).json({
        message: `Not enough stock. Requested ${units}, available ${entries.length}.`,
      });
    }

    // Destroy exactly `units` rows (oldest first)
    const toRemove = entries.slice(0, units);
    const removedIds = toRemove.map((e: any) => e.bloodId);

    for (const entry of toRemove) {
      await entry.destroy();
    }

    return res.status(200).json({
      message: `${units} unit(s) removed from inventory.`,
      removed: removedIds,
    });
  } catch (error) {
    console.error("decreaseInventory error:", error);
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ─────────────────────────────────────────────
// RESTORE INVENTORY  (re-creates a bag row)
// ─────────────────────────────────────────────
export async function restoreInventory(
  bloodType: string,
  component: string,
  units: number,
  role: string,
  facilityNo: string,
  dateOfProduce: string,
  source: SourceType = "admin"
): Promise<void> {
  const Model      = resolveInventoryModel(role);
  const expiration = calcExpiry(dateOfProduce, component);

  for (let i = 0; i < units; i++) {
    const serialNo = await generateScopedSerial(Model, facilityNo, bloodType, component);
    const bloodId  = buildBloodId(facilityNo, serialNo, component, bloodType, expiration, source);

    await Model.create({
      facilityNo,
      year:         new Date(dateOfProduce).getFullYear(),
      serialNo,
      bloodId,
      dateOfProduce: new Date(dateOfProduce),
      expiration,
      bloodType:    bloodType as any,
      component:    component as any,
      source,
      units: 1,
    });
  }
}