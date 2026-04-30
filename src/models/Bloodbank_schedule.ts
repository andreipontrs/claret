import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import BloodBank from "./bloodbank";

// ==============================
// TYPES
// ==============================
export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export const ALL_DAYS: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// ==============================
// INTERFACES
// ==============================
interface ScheduleAttributes {
  id: string;
  bloodBankId: string;
  day: DayOfWeek;
  open: boolean;
  startTime: string;
  endTime: string;
}

interface ScheduleCreation
  extends Optional<ScheduleAttributes, "id" | "open" | "startTime" | "endTime"> {}

// ==============================
// MODEL
// ==============================
class BloodBankSchedule
  extends Model<ScheduleAttributes, ScheduleCreation>
  implements ScheduleAttributes
{
  public id!: string;
  public bloodBankId!: string;
  public day!: DayOfWeek;
  public open!: boolean;
  public startTime!: string;
  public endTime!: string;
}

BloodBankSchedule.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bloodBankId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: "blood_bank_id",
    },
    day: {
      type: DataTypes.ENUM(
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ),
      allowNull: false,
    },
    open: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    startTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: "08:00",
      field: "start_time",
    },
    endTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: "17:00",
      field: "end_time",
    },
  },
  {
    sequelize,
    tableName: "blood_bank_schedules",
    timestamps: false,
  }
);

// ==============================
// ASSOCIATIONS
// ==============================
BloodBank.hasMany(BloodBankSchedule, {
  foreignKey: "bloodBankId",
  as: "walkInSchedule",
  onDelete: "CASCADE",
});

BloodBankSchedule.belongsTo(BloodBank, {
  foreignKey: "bloodBankId",
  as: "bloodBank",
});

export default BloodBankSchedule;