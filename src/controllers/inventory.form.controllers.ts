import { Request, Response } from "express";
import { Op } from "sequelize";
import { resolveInventoryModel } from "../helpers/resolveInventoryModel";
import BloodBank from "../models/bloodbank";

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

async function generateSerialNo(role: string): Promise<string> {
  const Model = resolveInventoryModel(role);
  const count = await Model.count();
  return String(count + 1).padStart(5, "0");
}

// ─────────────────────────────────────────────
// HELPER: resolve facilityNo for the logged-in user
// ─────────────────────────────────────────────
async function resolveFacilityNo(req: Request): Promise<string | null> {
  const role = (req as any).user?.role;
  const userId = (req as any).user?.id;

  if (role === "blood_bank") {
    const bloodBank = await BloodBank.findOne({ where: { id: userId } });
    return bloodBank?.facilityNo ?? null;
  }

  // admin — may pass facilityNo as query param to filter a specific facility,
  // or omit it to see all facilities
  return (req.query.facilityNo as string) ?? null;
}

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────
export async function createInventory(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    console.log("🔍 USER FROM TOKEN:", (req as any).user);
    const role = (req as any).user?.role;
    const userId = (req as any).user?.id;
    console.log("🔍 ROLE:", role);
    const Model = resolveInventoryModel(role);

    const {
      year,
      dateOfProduce,
      bloodType,
      component,
      units,
    }: {
      year: number;
      dateOfProduce: string;
      bloodType: string;
      component: string;
      units: number;
    } = req.body;

    let facilityNo: string;

    if (role === "blood_bank") {
      const bloodBank = await BloodBank.findOne({ where: { id: userId } });
      if (!bloodBank || !bloodBank.facilityNo) {
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
    const serialNo = await generateSerialNo(role);

    const entry = await Model.create({
      facilityNo,
      year,
      serialNo,
      dateOfProduce: new Date(dateOfProduce),
      expiration,
      bloodType: bloodType as any,
      component: component as any,
      units,
    });

    return res.status(201).json({
      message: "Inventory entry created successfully.",
      data: entry,
    });
  } catch (error: any) {
    console.error("CREATE INVENTORY ERROR:", error?.message, error?.original);
    return res.status(500).json({ message: "Server error.", error: error?.message });
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
    const role = (req as any).user?.role;
    const userId = (req as any).user?.id;
    const Model = resolveInventoryModel(role);

    const bloodType = toStr(req.query.bloodType as string | string[] | undefined);
    const component = toStr(req.query.component as string | string[] | undefined);
    const from      = toStr(req.query.from      as string | string[] | undefined);
    const to        = toStr(req.query.to        as string | string[] | undefined);
    const pageNum   = Math.max(1, parseInt(toStr(req.query.page  as string | string[] | undefined) ?? "1",  10));
    const limitNum  = Math.min(100, Math.max(1, parseInt(toStr(req.query.limit as string | string[] | undefined) ?? "20", 10)));

    const where: Record<string, any> = {};

    // ✅ FIX: scope by facilityNo for blood_bank role
    if (role === "blood_bank") {
      const bloodBank = await BloodBank.findOne({ where: { id: userId } });
      if (!bloodBank?.facilityNo) {
        return res.status(400).json({ message: "No facility found for this account." });
      }
      where.facilityNo = bloodBank.facilityNo;
    } else if (req.query.facilityNo) {
      // admin can optionally filter by a specific facility
      where.facilityNo = req.query.facilityNo;
    }

    if (bloodType) where.bloodType = bloodType;
    if (component) where.component = component;

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
    const role = (req as any).user?.role;
    const Model = resolveInventoryModel(role);

    const id = toStr(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid ID." });
    }

    const entry = await Model.findByPk(id);
    if (!entry) {
      return res.status(404).json({ message: "Inventory entry not found." });
    }

    return res.status(200).json({ data: entry });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ─────────────────────────────────────────────
// GET SUMMARY — ✅ FIXED: scoped by facilityNo
// ─────────────────────────────────────────────
export async function getInventorySummary(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const role = (req as any).user?.role;
    const userId = (req as any).user?.id;
    const Model = resolveInventoryModel(role);

    const where: Record<string, any> = {};

    // ✅ FIX: blood_bank users only see their own facility's inventory
    if (role === "blood_bank") {
      const bloodBank = await BloodBank.findOne({ where: { id: userId } });
      if (!bloodBank?.facilityNo) {
        return res.status(400).json({
          message: "No facility number found for this blood bank account.",
        });
      }
      where.facilityNo = bloodBank.facilityNo;
    } else if (req.query.facilityNo) {
      // admin can optionally filter by a specific facility
      where.facilityNo = req.query.facilityNo;
    }
    // admin with no facilityNo param sees all facilities combined

    const allEntries = await Model.findAll({ where });

    const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const summary: Record<string, any> = {};

    bloodTypes.forEach((bt) => {
      summary[bt] = {
        type: bt,
        units: 0,
        components: Object.fromEntries(ALL_COMPONENTS.map((c) => [c, 0])),
      };
    });

    allEntries.forEach((entry: any) => {
      const bt = entry.bloodType;
      if (!summary[bt]) return;
      summary[bt].units += entry.units;
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
    const role = (req as any).user?.role;
    const Model = resolveInventoryModel(role);

    const id = toStr(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid ID." });
    }

    const entry = await Model.findByPk(id);
    if (!entry) {
      return res.status(404).json({ message: "Inventory entry not found." });
    }

    const { dateOfProduce, component, units } = req.body;

    if (component && !ALL_COMPONENTS.includes(component)) {
      return res.status(400).json({ message: `Invalid component: ${component}` });
    }

    const updatedExpiration =
      dateOfProduce && component
        ? calcExpiry(dateOfProduce, component)
        : undefined;

    await entry.update({
      ...(dateOfProduce && { dateOfProduce: new Date(dateOfProduce) }),
      ...(updatedExpiration && { expiration: updatedExpiration }),
      ...(units !== undefined && { units }),
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
    const role = (req as any).user?.role;
    const Model = resolveInventoryModel(role);

    const id = toStr(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid ID." });
    }

    const entry = await Model.findByPk(id);
    if (!entry) {
      return res.status(404).json({ message: "Inventory entry not found." });
    }

    await entry.destroy();

    return res.status(200).json({ message: "Inventory entry deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ─────────────────────────────────────────────
// DECREASE INVENTORY
// ─────────────────────────────────────────────
export async function decreaseInventory(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const role = (req as any).user?.role;
    const userId = (req as any).user?.id;
    const Model = resolveInventoryModel(role);

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

    // ✅ FIX: scope decrease to blood bank's own facility
    if (role === "blood_bank") {
      const bloodBank = await BloodBank.findOne({ where: { id: userId } });
      if (!bloodBank?.facilityNo) {
        return res.status(400).json({ message: "No facility found for this account." });
      }
      where.facilityNo = bloodBank.facilityNo;
    }

    const entries = await Model.findAll({
      where,
      order: [["dateOfProduce", "ASC"]], // FIFO
    }) as any[];

    if (!entries.length) {
      return res.status(404).json({ message: "No inventory found." });
    }

    const totalAvailable = entries.reduce(
      (sum: number, e: any) => sum + e.units,
      0
    );

    if (totalAvailable < units) {
      return res.status(400).json({ message: "Not enough stock available." });
    }

    let toDeduct = units;
    for (const entry of entries) {
      if (toDeduct <= 0) break;
      if (entry.units >= toDeduct) {
        entry.units -= toDeduct;
        toDeduct = 0;
      } else {
        toDeduct -= entry.units;
        entry.units = 0;
      }
      await entry.save();
    }

    return res.status(200).json({ message: "Inventory decreased successfully." });
  } catch (error) {
    console.error("decreaseInventory error:", error);
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ─────────────────────────────────────────────
// RESTORE INVENTORY
// ─────────────────────────────────────────────
export async function restoreInventory(
  bloodType: string,
  component: string,
  units: number,
  role: string
): Promise<void> {
  const Model = resolveInventoryModel(role);
  const entry = await Model.findOne({
    where: { bloodType, component },
    order: [["dateOfProduce", "DESC"]],
  }) as any;

  if (entry) {
    entry.units += units;
    await entry.save();
  }
}