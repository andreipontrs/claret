import cron from "node-cron";
import { Op } from "sequelize";
import BloodDonationAppointment from "../models/donation";
import { sendSMS } from "../services/smsService";
import { smsTemplates } from "../template/smsTemplates";

// ── DONATION REMINDER CRON ────────────────────────────────────────────────────
// Runs every day at 8:00 AM.
// Finds all APPROVED appointments scheduled for tomorrow and sends an SMS reminder.

export function startDonationReminderCron(): void {
  cron.schedule("0 8 * * *", async () => {
    console.log("🕗 [Donation Reminder] Running daily reminder job...");

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Normalize to midnight–23:59 of tomorrow (full day window)
      const startOfTomorrow = new Date(tomorrow);
      startOfTomorrow.setHours(0, 0, 0, 0);

      const endOfTomorrow = new Date(tomorrow);
      endOfTomorrow.setHours(23, 59, 59, 999);

      const appointments = await BloodDonationAppointment.findAll({
        where: {
          status: "APPROVED",
          appointmentDate: {
            [Op.between]: [startOfTomorrow, endOfTomorrow],
          },
        },
      });

      if (appointments.length === 0) {
        console.log("ℹ️  [Donation Reminder] No appointments tomorrow.");
        return;
      }

      console.log(`📋 [Donation Reminder] Sending reminders to ${appointments.length} donor(s)...`);

      for (const appointment of appointments) {
        try {
          const formattedDate = new Date(appointment.appointmentDate).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          await sendSMS(
            appointment.mobileNumber,
            smsTemplates.donationReminder(
              appointment.firstName,
              formattedDate,
              appointment.appointmentTime,
              appointment.locationAddress ?? "our blood bank"
            )
          );

          console.log(`✅ Reminder sent to ${appointment.firstName} (${appointment.mobileNumber})`);
        } catch (smsErr) {
          console.error(
            `❌ Failed to send reminder to ${appointment.firstName} (${appointment.mobileNumber}):`,
            smsErr
          );
        }
      }
    } catch (err) {
      console.error("❌ [Donation Reminder] Cron job failed:", err);
    }
  });

  console.log("✅ [Donation Reminder] Cron job scheduled — runs daily at 8:00 AM.");
}