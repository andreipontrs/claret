import User from "./user";
import Role from "./role";

User.belongsTo(Role, {
  foreignKey: "roleId",
  as: "role",
});

Role.hasMany(User, {
  foreignKey: "roleId",
  as: "users",
});

export {
  User,
  Role,
};