import { Request, Response } from "express";
import BloodBank from "../models/bloodbank";
import Role from "../models/role";
import { resolveInventoryModel } from "../helpers/resolveInventoryModel";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export async function getMapInventory(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const banks = await BloodBank.findAll({
      where: { status: "active" },
      include: [
        { model: Role, as: "role" },
      ],
    });

    const results = await Promise.all(
      banks.map(async (bank: any) => {
        if (bank.lat === null || bank.lon === null) return null;

        try {
          const roleName = bank.role?.name as string;
          const Model = resolveInventoryModel(roleName);

          const whereClause = bank.facilityNo
            ? { facilityNo: bank.facilityNo }
            : {};

          const allEntries = await Model.findAll({ where: whereClause });

          const inventory: Record<string, number> = {};
          BLOOD_TYPES.forEach((bt) => (inventory[bt] = 0));

          allEntries.forEach((entry: any) => {
            if (inventory[entry.bloodType] !== undefined) {
              inventory[entry.bloodType] += entry.units;
            }
          });

          const totalUnits = Object.values(inventory).reduce((a, b) => a + b, 0);

          const name    = bank.facility?.facility_name ?? bank.hospitalName;
          const address = bank.facility?.address       ?? bank.address;

          return {
            id:         bank.id as string,
            name,
            address,
            lat:        Number(bank.lat),
            lon:        Number(bank.lon),
            is_admin:   roleName === "admin",
            inventory,
            totalUnits,
          };
        } catch {
          const inventory: Record<string, number> = {};
          BLOOD_TYPES.forEach((bt) => (inventory[bt] = 0));

          return {
            id:         bank.id as string,
            name:       bank.facility?.facility_name ?? bank.hospitalName,
            address:    bank.facility?.address       ?? bank.address,
            lat:        Number(bank.lat),
            lon:        Number(bank.lon),
            is_admin:   false,
            inventory,
            totalUnits: 0,
          };
        }
      })
    );

    const filtered = results.filter(Boolean);
    return res.status(200).json({ data: filtered });

  } catch (error) {
    return res.status(500).json({ message: "Server error.", error });
  }
}

// ─────────────────────────────────────────────
// UPDATE COORDINATES
// ─────────────────────────────────────────────
export async function updateCoordinates(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const id = req.params.id as string;
    const { lat, lon } = req.body;

    if (!lat || !lon) {
      return res.status(400).json({ message: "lat and lon are required." });
    }

    const bank = await BloodBank.findByPk(id);
    if (!bank) {
      return res.status(404).json({ message: "Blood bank not found." });
    }

    await bank.update({ lat, lon });

    return res.status(200).json({
      message: "Coordinates updated successfully.",
      data: {
        id: bank.id,
        lat: bank.lat,
        lon: bank.lon,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error });
  }
}