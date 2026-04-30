import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// 1. Attributes
interface AboutContactAttributes {
  id: number;
  about: string;
  contact: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Optional on create
interface AboutContactCreationAttributes
  extends Optional<AboutContactAttributes, "id"> {}

// 3. Model
class AboutContact
  extends Model<AboutContactAttributes, AboutContactCreationAttributes>
  implements AboutContactAttributes
{
  public id!: number;
  public about!: string;
  public contact!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 4. Init
AboutContact.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    about: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    contact: {
      type: DataTypes.TEXT, // flexible text (email, phone, address, etc.)
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "about_contact",
    timestamps: true,
  }
);

export default AboutContact;