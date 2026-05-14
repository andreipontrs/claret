import dotenv from "dotenv";
dotenv.config();

import sequelize from "./config/database";
import Role from "./models/role";
import User from "./models/user";
import Profile from "./models/profile";
import BloodBank from "./models/bloodbank";
import BloodBankSchedule from "./models/Bloodbank_schedule"; // ✅ added
import BloodTransfusionRequest from "./models/bloodRequest";
import BloodDonationAppointment from "./models/donation";
import Content from "./models/landingContent";
import About from "./models/about";
import UserContent from "./models/userContent";
import BloodbankContent from "./models/bloodbankContent";
import Inventory from "./models/inventory.form";
import BloodbankInventory from "./models/inventory.bloodbank";

const runORM = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected (ORM)");

    const models = [
      Role,
      User,
      Profile,
      BloodBank,
      BloodBankSchedule, // ✅ added
      BloodTransfusionRequest,
      BloodDonationAppointment,
      Content,
      About,
      UserContent,
      BloodbankContent,
      Inventory,
      BloodbankInventory,
    ];
    console.log("Models registered:", models.map((m) => m.name));

    // ── Associations ──────────────────────────────────────────

    // User ↔ Profile
    User.hasOne(Profile, { foreignKey: "user_id", onDelete: "CASCADE" });
    Profile.belongsTo(User, { foreignKey: "user_id" });

    // User ↔ BloodTransfusionRequest
    User.hasMany(BloodTransfusionRequest, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    BloodTransfusionRequest.belongsTo(User, { foreignKey: "userId" });

    // BloodBank ↔ BloodTransfusionRequest
    BloodBank.hasMany(BloodTransfusionRequest, {
      foreignKey: "bloodBankId",
      onDelete: "CASCADE",
    });
    BloodTransfusionRequest.belongsTo(BloodBank, { foreignKey: "bloodBankId" });

    // User ↔ BloodDonationAppointment
    User.hasMany(BloodDonationAppointment, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    BloodDonationAppointment.belongsTo(User, { foreignKey: "userId" });

    // BloodBank ↔ BloodDonationAppointment
    BloodBank.hasMany(BloodDonationAppointment, {
      foreignKey: "bloodBankId",
      onDelete: "CASCADE",
    });
    BloodDonationAppointment.belongsTo(BloodBank, { foreignKey: "bloodBankId" });

    console.log("Associations defined");

    // 🔥 DEV ONLY: reset tables
    await sequelize.sync({ force: true });
    console.log("All tables synced");

    // ✅ Seed About (single row)
    await About.findOrCreate({
      where: { id: 1 },
      defaults: {
        about: "Edit About Us here...",
        contact: "Edit Contact Info here...",
      },
    });

    // ✅ Seed roles
    const roles = ["admin", "blood_bank", "client"];
    for (const roleName of roles) {
      await Role.findOrCreate({ where: { name: roleName } });
    }

    console.log("Default roles and facility seeded");

    process.exit(0);
  } catch (err) {
    console.error("ORM error:", err);
    process.exit(1);
  }
};

runORM();