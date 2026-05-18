import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface ProfileAttributes {
  id: string;
  user_id: string;

  dob?: Date;
  gender?: "male" | "female" | "other";

  street?: string;
  city?: string;
  province?: string;
  zip?: string;

  nationality?: string;
  religion?: string;
  education?: string;
  occupation?: string;
  civilStatus?: string;

  bloodType?: string;
  medicalConditions?: string;

  willingToDonate: boolean;
  lastDonationDate?: Date;
  preferredDonationLocation?: string;

  needBlood: boolean;
  bloodTypeNeeded?: string;
  unitsNeeded?: number;
  urgencyLevel?: string;
  hospital?: string;
}

interface ProfileCreationAttributes extends Optional<ProfileAttributes, "id"> {}

class Profile extends Model<ProfileAttributes, ProfileCreationAttributes>
  implements ProfileAttributes {
  public id!: string;
  public user_id!: string;

  public dob?: Date;
  public gender?: "male" | "female" | "other";

  public street?: string;
  public city?: string;
  public province?: string;
  public zip?: string;

  public nationality?: string;
  public religion?: string;
  public education?: string;
  public occupation?: string;
  public civilStatus?: string;

  public bloodType?: string;
  public medicalConditions?: string;

  public willingToDonate!: boolean;
  public lastDonationDate?: Date;
  public preferredDonationLocation?: string;

  public needBlood!: boolean;
  public bloodTypeNeeded?: string;
  public unitsNeeded?: number;
  public urgencyLevel?: string;
  public hospital?: string;
}

Profile.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },

    dob: { type: DataTypes.DATEONLY, allowNull: true },
    gender: { type: DataTypes.ENUM("male", "female", "other"), allowNull: true },

    street:   { type: DataTypes.STRING, allowNull: true },
    city:     { type: DataTypes.STRING, allowNull: true },
    province: { type: DataTypes.STRING, allowNull: true },
    zip:      { type: DataTypes.STRING(10), allowNull: true },

    nationality:  { type: DataTypes.STRING, allowNull: true },
    religion:     { type: DataTypes.STRING, allowNull: true },
    education:    { type: DataTypes.STRING, allowNull: true },
    occupation:   { type: DataTypes.STRING, allowNull: true },
    civilStatus:  { type: DataTypes.STRING(50), allowNull: true },

    bloodType:         { type: DataTypes.STRING(20), allowNull: true },
    medicalConditions: { type: DataTypes.TEXT, allowNull: true },

    willingToDonate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    lastDonationDate:          { type: DataTypes.DATEONLY, allowNull: true },
    preferredDonationLocation: { type: DataTypes.STRING, allowNull: true },

    needBlood: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    bloodTypeNeeded: { type: DataTypes.STRING(5), allowNull: true },
    unitsNeeded:     { type: DataTypes.INTEGER, allowNull: true },
    urgencyLevel:    { type: DataTypes.STRING, allowNull: true },
    hospital:        { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    tableName: "profiles",
    timestamps: true,
    underscored: true,
  }
);

export default Profile;