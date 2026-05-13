import User from "./user";
import Role from "./role";
import BloodBank from "./bloodbank"

User.belongsTo(Role, {
  foreignKey: "roleId",
  as: "role",
});

Role.hasMany(User, {
  foreignKey: "roleId",
  as: "users",
});

User.hasOne(BloodBank, { foreignKey: "userId", as: "bloodBank" });

BloodBank.belongsTo(User, { foreignKey: "userId", as: "user" });

export {
  User,
  Role,
  BloodBank
};