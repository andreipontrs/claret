import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// 1. Define attributes
interface BloodbankContentAttributes {
  id: number;
  title: string;
  type: "Banner" | "Article" | "Guide" | "Document" | "PDF";
  content?: string | null;
  file_path?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Optional fields when creating
interface BloodbankContentCreationAttributes extends Optional<BloodbankContentAttributes, "id"> {}

// 3. Model class
class BloodbankContent extends Model<BloodbankContentAttributes, BloodbankContentCreationAttributes>
  implements BloodbankContentAttributes {
  public id!: number;
  public title!: string;
  public type!: "Banner" | "Article" | "Guide" | "Document" | "PDF";
  public content!: string | null;
  public file_path!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 4. Initialize model
BloodbankContent.init(
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
      type: DataTypes.ENUM("Banner", "Article", "Guide", "Document", "PDF"),
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
  },
  {
    sequelize,
    tableName: "bloodbank_contents",
    timestamps: true,
  }
);

export default BloodbankContent;