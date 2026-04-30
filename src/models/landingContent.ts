import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface ContentAttributes {
  id: number;
  title: string;
  type:
    | "Banner"
    | "Article"
    | "Guide"
    | "Document"
    | "PDF"
    | "Donation"
    | "Announcement";
  section: "Landing Page" | "Users" | "Blood Banks";
  content: string | null;
  file_path: string | null;
  order: number;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  location_address: string | null;
  location_unit: string | null;
  created_by: string | null;
  role_scope: "admin" | "blood_bank" | null;
}

interface ContentCreationAttributes
  extends Optional
    < ContentAttributes,
    | "id"
    | "content"
    | "file_path"
    | "order"
    | "event_date"
    | "event_time"
    | "location"
    | "location_address"
    | "location_unit"
    | "created_by"
    | "role_scope"
  > {}

class Content
  extends Model<ContentAttributes, ContentCreationAttributes>
  implements ContentAttributes
{
  public id!: number;
  public title!: string;
  public type!: ContentAttributes["type"];
  public section!: "Landing Page" | "Users" | "Blood Banks";
  public content!: string | null;
  public file_path!: string | null;
  public order!: number;
  public event_date!: string | null;
  public event_time!: string | null;
  public location!: string | null;
  public location_address!: string | null;
  public location_unit!: string | null;
  public created_by!: string | null;
  public role_scope!: "admin" | "blood_bank" | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Content.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        "Banner",
        "Article",
        "Guide",
        "Document",
        "PDF",
        "Donation",
        "Announcement"
      ),
      allowNull: false,
    },
    section: {
      type: DataTypes.ENUM("Landing Page", "Users", "Blood Banks"),
      allowNull: false,
      defaultValue: "Landing Page",
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    event_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    event_time: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location_unit: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    role_scope: {
      type: DataTypes.ENUM("admin", "blood_bank"),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Content",
    tableName: "contents",
    timestamps: true,
  }
);

export default Content;