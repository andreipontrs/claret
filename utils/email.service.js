"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetPasswordEmail = exports.sendVerificationEmail = void 0;
exports.sendAppointmentConfirmationEmail = sendAppointmentConfirmationEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const sendVerificationEmail = async (email, firstName, token) => {
    const link = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    await transporter.sendMail({
        from: `"Claret" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Email Verification",
        html: `
      <h3>Welcome to Claret, ${firstName}!</h3>
      <p>To finish setting up your account, we need to make sure this email address is yours.</p>
      <p>To verify your account please click the link below:</p>
      <a href="${link}">${link}</a>
      <br>
      <p>If you didn't request this, you can safely ignore this email. Someone else might have typed your email address by mistake.</p>
      <br>
      <p>Thanks,</p>
      <p>Claret Team</p>
    `,
    });
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendResetPasswordEmail = async (email, token) => {
    const link = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await transporter.sendMail({
        from: `"Claret" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Reset Password",
        html: `
      <p>Reset your password:</p>
      <a href="${link}">${link}</a>
      <p>This link expires in 30 minutes.</p>
      <br>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <br>
      <p>Thanks,</p>
      <p>Claret Team</p>
    `,
    });
};
exports.sendResetPasswordEmail = sendResetPasswordEmail;
// ── Donation Appointment Confirmation ─────────────────────────────────────────
async function sendAppointmentConfirmationEmail({ to, firstName, appointmentDate, appointmentTime, }) {
    const [h, min] = appointmentTime.split(":");
    const hr = parseInt(h);
    const timeFormatted = `${hr > 12 ? hr - 12 : hr || 12}:${min} ${hr >= 12 ? "PM" : "AM"}`;
    const dateFormatted = new Date(appointmentDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    await transporter.sendMail({
        from: `"Claret" <${process.env.EMAIL_USER}>`,
        to,
        subject: "✅ Donation Appointment Confirmed",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #d55757;">Hello, ${firstName}! 👋</h2>
        <p style="font-size: 15px; color: #333;">
          Your <strong>blood donation appointment</strong> has been successfully scheduled. Thank you for signing up!
        </p>

        <div style="background: #fff5f5; border-left: 4px solid #d55757; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #555;"><strong>📅 Date:</strong> ${dateFormatted}</p>
          <p style="margin: 8px 0 0; font-size: 14px; color: #555;"><strong>🕐 Time:</strong> ${timeFormatted}</p>
        </div>

        <p style="font-size: 14px; color: #555;">
          If you need to <strong>reschedule</strong> or <strong>cancel</strong>, please log in to your account and manage your appointment from there.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

        <p style="font-size: 13px; color: #999; text-align: center;">
          Thank you for saving lives ❤️<br/>
          <strong style="color: #d55757;">Claret Team</strong>
        </p>
      </div>
    `,
    });
}
