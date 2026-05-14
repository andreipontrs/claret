import { Op } from "sequelize";
import BloodbankInventory from "../models/inventory.bloodbank";

export async function autoExpireInventory(facilityNo: string) {
  const now = new Date();

  await BloodbankInventory.update(
    { status: "expired" },
    {
      where: {
        facilityNo,
        status: "available",
        expiration: {
          [Op.lt]: now,
        },
      },
    }
  );
}