import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export type Sex = "MALE" | "FEMALE" | "OTHER";

export type CivilStatus =
  | "SINGLE"
  | "MARRIED"
  | "WIDOWED"
  | "SEPARATED"
  | "DIVORCED";

// Simplified — WAITING_FOR_APPROVAL and WAITING_FOR_REUPLOAD removed.
// needsReupload boolean replaces WAITING_FOR_REUPLOAD status.
export type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "FULFILLED"
  | "REJECTED"
  | "CANCELLED";

interface BloodTransfusionRequestAttributes {
  id: string;
  userId: string;
  requestToId: string;
  date: Date;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  age: number;
  birthday: Date;
  civilStatus: CivilStatus;
  sex: Sex;
  street: string;
  city: string;
  province: string;
  zipCode: string;
  mobileNumber: string;
  email: string;
  attachments: string[];
  status: RequestStatus;
  needsReupload: boolean;          // ← replaces WAITING_FOR_REUPLOAD status
  rejectionReason?: string | null;
  reviewedById?: string | null;
  reviewedAt?: Date | null;
  bloodId?: string | null;
  bloodType?: string | null;
  component?: string | null;
  units?: number | null;
  remarks?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BloodTransfusionRequestCreation
  extends Optional<
    BloodTransfusionRequestAttributes,
    | "id"
    | "date"
    | "middleName"
    | "attachments"
    | "status"
    | "needsReupload"
    | "rejectionReason"
    | "reviewedById"
    | "reviewedAt"
    | "bloodId"
    | "bloodType"
    | "component"
    | "units"
    | "remarks"
    | "createdAt"
    | "updatedAt"
  > {}

class BloodTransfusionRequest extends Model<
  BloodTransfusionRequestAttributes,
  BloodTransfusionRequestCreation
> {
  declare id: string;
  declare userId: string;
  declare requestToId: string;
  declare date: Date;
  declare firstName: string;
  declare middleName?: string | null;
  declare lastName: string;
  declare age: number;
  declare birthday: Date;
  declare civilStatus: CivilStatus;
  declare sex: Sex;
  declare street: string;
  declare city: string;
  declare province: string;
  declare zipCode: string;
  declare mobileNumber: string;
  declare email: string;
  declare attachments: string[];
  declare status: RequestStatus;
  declare needsReupload: boolean;
  declare rejectionReason?: string | null;
  declare reviewedById?: string | null;
  declare reviewedAt?: Date | null;
  declare bloodId?: string | null;
  declare bloodType?: string | null;
  declare component?: string | null;
  declare units?: number | null;
  declare remarks?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

BloodTransfusionRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    requestToId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "blood_banks",
        key: "id",
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    firstName:  { type: DataTypes.STRING, allowNull: false },
    middleName: { type: DataTypes.STRING, allowNull: true },
    lastName:   { type: DataTypes.STRING, allowNull: false },
    age:        { type: DataTypes.INTEGER,  allowNull: false },
    birthday:   { type: DataTypes.DATEONLY, allowNull: false },
    civilStatus: {
      type: DataTypes.ENUM("SINGLE", "MARRIED", "WIDOWED", "SEPARATED", "DIVORCED"),
      allowNull: false,
    },
    sex: {
      type: DataTypes.ENUM("MALE", "FEMALE", "OTHER"),
      allowNull: false,
    },
    street:       { type: DataTypes.STRING,     allowNull: false },
    city:         { type: DataTypes.STRING,     allowNull: false },
    province:     { type: DataTypes.STRING,     allowNull: false },
    zipCode:      { type: DataTypes.STRING(10), allowNull: false },
    mobileNumber: { type: DataTypes.STRING(20), allowNull: false },
    email:        { type: DataTypes.STRING,     allowNull: false },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM(
        "PENDING",
        "APPROVED",
        "FULFILLED",
        "REJECTED",
        "CANCELLED"
      ),
      allowNull: false,
      defaultValue: "PENDING",
    },
    needsReupload: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    rejectionReason: { type: DataTypes.TEXT,    allowNull: true },
    reviewedById: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    reviewedAt:  { type: DataTypes.DATE,    allowNull: true },
    bloodId: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    bloodType:   { type: DataTypes.STRING,  allowNull: true },
    component:   { type: DataTypes.STRING,  allowNull: true },
    units:       { type: DataTypes.INTEGER, allowNull: true },
    remarks:     { type: DataTypes.TEXT,    allowNull: true },
  },
  {
    sequelize,
    tableName: "blood_transfusion_requests",
    timestamps: true,
    underscored: true,
  }
);

export default BloodTransfusionRequest;