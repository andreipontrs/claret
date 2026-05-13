import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ==============================
// SEND ACTIVATION EMAIL
// ==============================
export const sendActivationEmail = async (
  email: string,
  activationLink: string,
  plainPassword: string
) => {
  try {
    await transporter.sendMail({
      from: `"Claret Blood Bank System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Activate Your Blood Bank Account",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          
          <h2 style="color: #d55757;">You're Invited!</h2>

          <p>
            You have been invited to join the <strong>Claret Blood Bank System</strong>.
          </p>

          <p><strong>Login Credentials:</strong></p>

          <div style="background:#f4f4f4; padding:10px; border-radius:6px;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${plainPassword}</p>
          </div>
          
          <p style="font-size: 13px; color: #777;">
            Please change your password after first login.
          </p>

          <hr style="margin: 20px 0;" />

          <p style="font-size: 12px; color: #aaa;">
            © Claret Blood Bank System
          </p>
        </div>
      `,
    });

    console.log("✅ Activation email sent to:", email);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw new Error("Failed to send email");
  }
};