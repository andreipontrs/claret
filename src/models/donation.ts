import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

/* ── ENUM TYPES ───────────────────────────────────────── */

export type AppointmentStatus =
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "FULFILLED";

export type CivilStatus = "SINGLE" | "MARRIED" | "WIDOWED" | "SEPARATED";
export type Sex = "MALE" | "FEMALE";
export type BloodType =
  | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

/* ── MAIN ATTRIBUTES ─────────────────────────────────── */

interface DonationAppointmentAttributes {
  id: string;
  userId: string;

  submittedAt: Date;

  firstName: string;
  middleName?: string | null;
  lastName: string;
  birthday: Date;
  age: number;

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

  appointmentDate: Date;
  appointmentTime: string;

  latitude?: number | null;
  longitude?: number | null;
  locationAddress?: string | null;

  attachments: string[];

  status: AppointmentStatus;

  reviewNotes?: string | null;
  reviewedById?: string | null;
  reviewedAt?: Date | null;

  cancelReason?: string | null;

  requestToId?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

/* ── CREATION ATTRIBUTES ─────────────────────────────── */

interface DonationAppointmentCreationAttributes
  extends Optional<
    DonationAppointmentAttributes,
    | "id"
    | "middleName"
    | "nationality"
    | "religion"
    | "education"
    | "occupation"
    | "telephoneNumber"
    | "latitude"
    | "longitude"
    | "locationAddress"
    | "attachments"
    | "reviewNotes"
    | "reviewedById"
    | "reviewedAt"
    | "cancelReason"
    | "createdAt"
    | "updatedAt"
  > {}

/* ── MODEL CLASS ─────────────────────────────────────── */

class BloodDonationAppointment extends Model<
  DonationAppointmentAttributes,
  DonationAppointmentCreationAttributes
> implements DonationAppointmentAttributes {

  public id!: string;
  public userId!: string;

  public submittedAt!: Date;

  public firstName!: string;
  public middleName!: string | null;
  public lastName!: string;
  public birthday!: Date;
  public age!: number;

  public civilStatus!: CivilStatus;
  public sex!: Sex;

  public street!: string;
  public city!: string;
  public province!: string;
  public zipCode!: string;

  public nationality!: string | null;
  public religion!: string | null;
  public education!: string | null;
  public occupation!: string | null;

  public telephoneNumber!: string | null;
  public mobileNumber!: string;
  public email!: string;

  public bloodType!: BloodType;

  public appointmentDate!: Date;
  public appointmentTime!: string;


  public locationAddress!: string | null;

  public attachments!: string[];

  public status!: AppointmentStatus;

  public reviewNotes!: string | null;
  public reviewedById!: string | null;
  public reviewedAt!: Date | null;

  public cancelReason!: string | null;

  public requestToId!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

/* ── INIT ───────────────────────────────────────────── */

BloodDonationAppointment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    firstName: { type: DataTypes.STRING, allowNull: false },
    middleName: { type: DataTypes.STRING, allowNull: true },
    lastName: { type: DataTypes.STRING, allowNull: false },

    birthday: { type: DataTypes.DATEONLY, allowNull: false },
    age: { type: DataTypes.INTEGER, allowNull: false },

    civilStatus: {
      type: DataTypes.ENUM("SINGLE", "MARRIED", "WIDOWED", "SEPARATED"),
      allowNull: false,
    },

    sex: {
      type: DataTypes.ENUM("MALE", "FEMALE"),
      allowNull: false,
    },

    street: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    province: { type: DataTypes.STRING, allowNull: false },
    zipCode: { type: DataTypes.STRING, allowNull: false },

    nationality: { type: DataTypes.STRING, allowNull: true },
    religion: { type: DataTypes.STRING, allowNull: true },
    education: { type: DataTypes.STRING, allowNull: true },
    occupation: { type: DataTypes.STRING, allowNull: true },

    telephoneNumber: { type: DataTypes.STRING, allowNull: true },
    mobileNumber: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },

    bloodType: {
      type: DataTypes.ENUM("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"),
      allowNull: false,
    },

    appointmentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    appointmentTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    locationAddress: { type: DataTypes.TEXT, allowNull: true },

    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },

    // ✅ AUTO APPROVED — no pending anymore
    status: {
      type: DataTypes.ENUM("APPROVED", "REJECTED", "CANCELLED", "FULFILLED"),
      allowNull: false,
      defaultValue: "APPROVED",
    },

    reviewNotes: { type: DataTypes.TEXT, allowNull: true },
    reviewedById: { type: DataTypes.UUID, allowNull: true },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },

    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    requestToId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "blood_donation_appointments",
    timestamps: true,
  }
);

export default BloodDonationAppointment;