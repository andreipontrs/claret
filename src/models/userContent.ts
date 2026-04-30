import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// 1. Define attributes
interface UserContentAttributes {
  id: number;
  title: string;
  type: "Banner" | "Article" | "Guide" | "Document" | "PDF" | "Donation";
  content?: string | null;
  file_path?: string | null;
  address?: string | null;
  donation_time?: string | null;
  donation_date?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Optional fields when creating
interface UserContentCreationAttributes extends Optional<UserContentAttributes, "id"> {}

// 3. Model class
class UserContent extends Model<UserContentAttributes, UserContentCreationAttributes>
  implements UserContentAttributes {
  public id!: number;
  public title!: string;
  public type!: "Banner" | "Article" | "Guide" | "Document" | "PDF" | "Donation";
  public content!: string | null;
  public file_path!: string | null;
  public address!: string | null;
  public donation_time!: string | null;
  public donation_date!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 4. Initialize model
UserContent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    type: {
      type: DataTypes.ENUM("Banner", "Article", "Guide", "Document", "PDF", "Donation"),
      allowNull: false,
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    file_path: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    donation_time: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    donation_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "user_contents",
    timestamps: true,
  }
);

export default UserContent;