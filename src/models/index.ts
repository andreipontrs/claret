import User from "./user";
import Role from "./role";
import Profile from "./profile";
import BloodBank from "./bloodbank";
import BloodTransfusionRequest from "./bloodRequest";
import Content from "./landingContent";
import BloodDonationAppointment from "./donation";

// USER ↔ ROLE
User.belongsTo(Role, {
  foreignKey: "roleId",
  as: "role",
});

Role.hasMany(User, {
  foreignKey: "roleId",
  as: "users",
});

// USER ↔ BLOODBANK
User.hasOne(BloodBank, {
  foreignKey: "userId",
  as: "bloodBank",
});

BloodBank.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// USER ↔ PROFILE
User.hasOne(Profile, {
  foreignKey: "user_id",
  as: "profile",
});

Profile.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

BloodDonationAppointment.belongsTo(BloodBank, {
  foreignKey: "requestToId",
  as: "requestToBloodBank", // lets the include populate item.requestToId as the BloodBank object
});

BloodBank.hasMany(BloodDonationAppointment, {
  foreignKey: "requestToId",
  as: "donationAppointments",
});

export {
  User,
  Role,
  BloodBank,
  Profile,
  BloodDonationAppointment
};