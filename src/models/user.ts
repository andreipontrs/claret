import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { BelongsToGetAssociationMixin } from "sequelize";
import Role from "./role";

interface UserAttributes {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;       // ← added
  email: string;
  phoneNumber: string;
  password: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationTokenExpires?: Date | null;
  roleId: string;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreation
  extends Optional<     
    UserAttributes,
    | "id"
    | "middleName"
    | "suffix"                  // ← added
    | "isEmailVerified"
    | "emailVerificationToken"
    | "emailVerificationTokenExpires"
    | "resetPasswordToken"
    | "resetPasswordExpires"
    | "createdAt"
    | "updatedAt"
  > {}

class User
  extends Model<UserAttributes, UserCreation>
  implements UserAttributes
{
  public id!: string;
  public firstName!: string;
  public middleName?: string | null;
  public lastName!: string;
  public suffix?: string | null;        // ← added
  public email!: string;
  public phoneNumber!: string;
  public password!: string;

  public isEmailVerified!: boolean;
  public emailVerificationToken?: string | null;
  public emailVerificationTokenExpires?: Date | null;

  public resetPasswordToken?: string | null;
  public resetPasswordExpires?: Date | null;

  public roleId!: string;

  public role?: Role;
  public getRole!: BelongsToGetAssociationMixin<Role>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    middleName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    suffix: {                   // ← added
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false, 
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    emailVerificationToken: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    emailVerificationTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    roleId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "roles",
        key: "id",
      },
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    underscored: true,
  }
);

export default User;