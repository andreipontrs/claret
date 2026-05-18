import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type ComponentType =
  | "Whole Blood"
  | "Packed RBC"
  | "Washed RBC"
  | "Buffy Coat-Poor RBC"
  | "Platelet Concentrate"
  | "Apheresis Platelets"
  | "Leukocyte-Poor Platelet Concentrate"
  | "Fresh Frozen Plasma"
  | "Leukocyte-Poor FFP"
  | "Cryoprecipitate";

interface InventoryAttributes {
  id: string;
  facilityNo: string;
  year: number;
  serialNo: string;
  dateOfProduce: Date;
  expiration: Date;
  bloodType: BloodType;
  component: ComponentType;
  units: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InventoryCreation
  extends Optional
  <  InventoryAttributes,
    "id" | "createdAt" | "updatedAt"
  > {}

  export type InventoryStatus =
  | "available"
  | "used"
  | "expired"
  | "disposed";

class Inventory extends Model<InventoryAttributes, InventoryCreation> {
  declare id: string;
  declare facilityNo: string;
  declare year: number;
  declare serialNo: string;
  declare dateOfProduce: Date;
  declare expiration: Date;
  declare bloodType: BloodType;
  declare component: ComponentType;
  declare units: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Inventory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    facilityNo: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    serialNo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    dateOfProduce: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    expiration: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    bloodType: {
      type: DataTypes.ENUM("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"),
      allowNull: false,
    },
    component: {
      type: DataTypes.ENUM(
        "Whole Blood",
        "Packed RBC",
        "Washed RBC",
        "Buffy Coat-Poor RBC",
        "Platelet Concentrate",
        "Apheresis Platelets",
        "Leukocyte-Poor Platelet Concentrate",
        "Fresh Frozen Plasma",
        "Leukocyte-Poor FFP",
        "Cryoprecipitate"
      ),
      allowNull: false,
    },
    units: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    tableName: "inventory",
    timestamps: true,
    underscored: true,
  }
);

export default Inventory;