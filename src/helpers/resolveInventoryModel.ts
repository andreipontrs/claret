// src/helpers/resolveInventoryModel.ts

import Inventory from "../models/inventory.form";
import BloodbankInventory from "../models/inventory.bloodbank";
import { ModelStatic, Model } from "sequelize";

export function resolveInventoryModel(role: string): ModelStatic<Model> {
  const normalized = role?.toLowerCase();
  switch (normalized) {
    case "admin":       return Inventory;
    case "blood_bank":  return BloodbankInventory;
    default:
      throw new Error(`Unauthorized role: ${role}`);
  }
}