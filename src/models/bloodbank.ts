import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Role from "./role";

interface BloodBankAttributes {
  id: string;
  email: string;
  password: string | null;
  roleId: string;
  status: "active" | "inactive";
  activationToken: string | null;
  activationTokenExpiry: Date | null;
  hospitalName: string;
  address: string;
  contactNo: string;
  telephoneNo: string | null;
  lat: number | null;
  lon: number | null;
  facilityNo: string | null;
  userId?: string | null;
}

interface BloodBankCreation
  extends Optional<
    BloodBankAttributes,
    | "id"
    | "telephoneNo"
    | "password"
    | "activationToken"
    | "activationTokenExpiry"
    | "lat"
    | "lon"
    | "userId" 
  > {}

class BloodBank
  extends Model<BloodBankAttributes, BloodBankCreation>
  implements BloodBankAttributes
{
  public id!: string;
  public hospitalName!: string;
  public address!: string;
  public contactNo!: string;
  public telephoneNo!: string | null;
  public email!: string;
  public password!: string | null;
  public roleId!: string;
  public status!: "active" | "inactive";
  public activationToken!: string | null;
  public activationTokenExpiry!: Date | null;
  public lat!: number | null;
  public lon!: number | null;
  public facilityNo!: string | null;
  public userId?: string | null;
}

BloodBank.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    hospitalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    contactNo: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    telephoneNo: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    roleId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "inactive",
    },
    activationToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    activationTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lat: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true,
    },
    lon: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true,
    },
    facilityNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "facility_no",
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "blood_banks",
    timestamps: true,
  }
);

BloodBank.belongsTo(Role, { foreignKey: "roleId", as: "role" });
Role.hasMany(BloodBank, { foreignKey: "roleId", as: "bloodBanks" });

export default BloodBank;