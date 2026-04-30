import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface RoleAttributes {
  id: string;
  name: "admin" | "blood_bank" | "client"; 
}

interface RoleCreation extends Optional<RoleAttributes, "id"> {}

class Role extends Model<RoleAttributes, RoleCreation>
  implements RoleAttributes
{
  public id!: string;
  public name!: "admin" | "blood_bank" | "client"; 
}

Role.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: "roles",
    timestamps: false,
  }
);

export default Role;