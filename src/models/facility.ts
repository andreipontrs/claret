import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface FacilityAttributes {
  id: number;
  facility_no: string;
  facility_name: string;
  address?: string | null;
  contact_no?: string | null;
  lat?: number | null;
  lon?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FacilityCreationAttributes
  extends Optional<FacilityAttributes, "id"> {}

class Facility
  extends Model<FacilityAttributes, FacilityCreationAttributes>
  implements FacilityAttributes
{
  public id!: number;
  public facility_no!: string;
  public facility_name!: string;
  public address!: string | null;
  public contact_no!: string | null;
  public lat!: number | null;
  public lon!: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Facility.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    facility_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    facility_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    contact_no: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    lat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    lon: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "facilities",
    timestamps: true,
  }
);

export default Facility;