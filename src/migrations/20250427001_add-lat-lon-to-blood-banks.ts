import { DataTypes } from "sequelize";
import sequelize from "../config/database";

async function runMigration() {
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.addColumn("blood_banks", "facility_no", {
    type: DataTypes.STRING(50),
    allowNull: true,
  });

  console.log("✅ facility_no column added to blood_banks.");
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  });