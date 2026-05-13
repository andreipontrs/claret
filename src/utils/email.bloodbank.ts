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
export const sendActivationEmail = async (email: string, activationLink: string) => {
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

          <p>
            Please click the button below to activate your account:
          </p>

          <div style="margin: 20px 0;">
            <a href="${activationLink}" 
               style="
                 background-color: #d55757;
                 color: #ffffff;
                 padding: 12px 20px;
                 text-decoration: none;
                 border-radius: 6px;
                 display: inline-block;
                 font-weight: bold;
               ">
              Activate Account
            </a>
          </div>

          <p style="font-size: 13px; color: #777;">
            This link will expire in 24 hours.
          </p>

          <p style="font-size: 13px; color: #777;">
            If you did not request this, please ignore this email.
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