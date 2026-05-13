import nodemailer from "nodemailer";

// ── Single shared transporter ─────────────────────────────────────────────────
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (
  email: string,
  firstName: string,
  token: string
): Promise<void> => {
  const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  const year = new Date().getFullYear();

  await transporter.sendMail({
    from: `"Claret" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your Claret account",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
          <tr>
            <td style="background:#d55757;padding:32px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:1px;">CLARET</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 48px 32px;">
              <h1 style="margin:0 0 12px;font-size:22px;color:#1a1a1a;font-weight:600;">
                Verify your email address
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.6;">
                Hi ${firstName}, thanks for signing up for Claret. Click the button below
                to confirm your email address and activate your account.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#d55757;border-radius:8px;">
                    <a href="${link}"
                      style="display:inline-block;padding:14px 32px;font-size:15px;
                             font-weight:600;color:#ffffff;text-decoration:none;">
                      Verify email address
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#888888;line-height:1.6;">
                This link expires in <strong>24 hours</strong>. If you didn't create a
                Claret account, you can safely ignore this email.
              </p>
              <p style="margin:24px 0 0;font-size:12px;color:#aaaaaa;">
                If the button doesn't work, copy and paste this link:<br/>
                <a href="${link}" style="color:#d55757;word-break:break-all;">${link}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:20px 48px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;">© ${year} Claret. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
};

// ── Reset Password ────────────────────────────────────────────────────────────
export const sendResetPasswordEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const link = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  const year = new Date().getFullYear();

  await transporter.sendMail({
    from: `"Claret" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your Claret password",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">

          <!-- Header -->
          <tr>
            <td style="background:#d55757;padding:32px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:1px;">CLARET</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px 32px;">
              <h1 style="margin:0 0 12px;font-size:22px;color:#1a1a1a;font-weight:600;">
                Reset your password
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.6;">
                We received a request to reset your Claret account password.
                Click the button below to set a new password. This link expires in
                <strong>1 hour</strong>.
              </p>

              <!-- Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#d55757;border-radius:8px;">
                    <a href="${link}"
                      style="display:inline-block;padding:14px 32px;font-size:15px;
                             font-weight:600;color:#ffffff;text-decoration:none;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#888888;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email.
                Your password will not be changed.
              </p>

              <p style="margin:24px 0 0;font-size:12px;color:#aaaaaa;">
                If the button doesn't work, copy and paste this link:<br/>
                <a href="${link}" style="color:#d55757;word-break:break-all;">${link}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:20px 48px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;">© ${year} Claret. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
};

// ── Activate Account ──────────────────────────────────────────────────────────
export const sendActivationEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const link = `${process.env.FRONTEND_URL}/activate-account/${token}`;

  await transporter.sendMail({
    from: `"Claret" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Activate Account",
    html: `<a href="${link}">Activate Account</a>`,
  });
};

// ── Donation Appointment Confirmation ─────────────────────────────────────────
export async function sendAppointmentConfirmationEmail({
  to,
  firstName,
  appointmentDate,
  appointmentTime,
}: {
  to: string;
  firstName: string;
  appointmentDate: string;
  appointmentTime: string;
}): Promise<void> {
  const [h, min] = appointmentTime.split(":");
  const hr = parseInt(h);
  const timeFormatted = `${hr > 12 ? hr - 12 : hr || 12}:${min} ${hr >= 12 ? "PM" : "AM"}`;
  const dateFormatted = new Date(appointmentDate).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  await transporter.sendMail({
    from: `"Claret" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Donation Appointment Confirmed",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:10px;">
        <h2 style="color:#d55757;">Hello, ${firstName}!</h2>
        <p style="font-size:15px;color:#333;">
          Your <strong>blood donation appointment</strong> has been successfully scheduled.
        </p>
        <div style="background:#fff5f5;border-left:4px solid #d55757;padding:14px 18px;border-radius:6px;margin:20px 0;">
          <p style="margin:0;font-size:14px;color:#555;"><strong>Date:</strong> ${dateFormatted}</p>
          <p style="margin:8px 0 0;font-size:14px;color:#555;"><strong>Time:</strong> ${timeFormatted}</p>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="font-size:13px;color:#999;text-align:center;">
          Thank you for saving lives<br/>
          <strong style="color:#d55757;">Claret Blood Bank Team</strong>
        </p>
      </div>`,
  });
}

// ── Request Clearer Image ─────────────────────────────────────────────────────
// Notifies the patient that a clearer document is needed.
// Instructs them to log in and use the notification bell to re-upload.
export async function sendClearerImageRequestEmail({
  to,
  firstName,
  lastName,
  requestId,
}: {
  to: string;
  firstName: string;
  lastName: string;
  requestId: string;
}): Promise<void> {
  const loginUrl = `${process.env.FRONTEND_URL}`;
  const year = new Date().getFullYear();

  await transporter.sendMail({
    from: `"Claret Blood Services" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Action Required: Clearer Referral Document Needed",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">

          <!-- Header -->
          <tr>
            <td style="background:#d55757;padding:32px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:1px;">CLARET</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px 32px;">
              <h1 style="margin:0 0 12px;font-size:22px;color:#1a1a1a;font-weight:600;">
                Clearer Document Required
              </h1>
              <p style="margin:0 0 16px;font-size:15px;color:#555555;line-height:1.6;">
                Hi <strong>${firstName} ${lastName}</strong>,
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#555555;line-height:1.6;">
                Our team has reviewed your blood transfusion request and we need a
                <strong>clearer copy of your referral document</strong> before we can proceed.
                The image you submitted was either too blurry, cropped, or difficult to read.
              </p>

              <!-- Action steps -->
              <div style="background:#fff5f5;border-left:4px solid #d55757;padding:16px 20px;border-radius:6px;margin:0 0 24px;">
                <p style="margin:0 0 8px;font-size:14px;color:#1a1a1a;font-weight:600;">
                  How to re-upload your document:
                </p>
                <ol style="margin:0;padding-left:18px;font-size:14px;color:#555;line-height:1.8;">
                  <li>Log in to your <strong>Claret account</strong></li>
                  <li>Click the <strong>🔔 notification bell</strong> at the top right</li>
                  <li>Click <strong>"Re-upload Document Now"</strong> on the notification</li>
                  <li>Upload a clearer photo and submit</li>
                </ol>
              </div>

              <!-- Tips -->
              <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:28px;">
                <p style="margin:0;font-size:12px;color:#92400e;line-height:1.6;">
                  <strong>Tips for a clear photo:</strong><br/>
                  • Lay the document flat on a bright surface<br/>
                  • Ensure all text is fully visible and in focus<br/>
                  • Avoid shadows or glare on the document<br/>
                  • Use your phone's document scanner mode if available
                </p>
              </div>

              <!-- Login button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#d55757;border-radius:8px;">
                    <a href="${loginUrl}"
                      style="display:inline-block;padding:14px 32px;font-size:15px;
                             font-weight:600;color:#ffffff;text-decoration:none;">
                      Log In to Claret
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;">
                This is an automated message. Do not reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:20px 48px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;">
                © ${year} Claret Blood Services. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}

export const sendAdminCredentialsEmail = async (
  email: string,
  firstName: string,
  password: string
): Promise<void> => {
  const loginLink = `${process.env.FRONTEND_URL}/login`;
  const year = new Date().getFullYear();

  await transporter.sendMail({
    from: `"Claret Admin System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Admin Account Credentials - Claret",

    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>

<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">

          <!-- Header -->
          <tr>
            <td style="background:#d55757;padding:32px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:1px;">
                CLARET ADMIN
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px 32px;">

              <h1 style="margin:0 0 12px;font-size:22px;color:#1a1a1a;font-weight:600;">
                Welcome, ${firstName}
              </h1>

              <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
                Your <strong>admin account</strong> has been successfully created.
                Below are your login credentials:
              </p>

              <!-- Credentials Box -->
              <div style="background:#fef5f5;border-left:4px solid #d55757;padding:16px 20px;border-radius:6px;margin-bottom:20px;">
                <p style="margin:0;font-size:14px;color:#333;">
                  <strong>Email:</strong> ${email}
                </p>
                <p style="margin:8px 0 0;font-size:14px;color:#333;">
                  <strong>Password:</strong> ${password}
                </p>
              </div>

              <!-- Login Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#d55757;border-radius:8px;">
                    <a href="${loginLink}"
                      style="display:inline-block;padding:14px 32px;font-size:15px;
                             font-weight:600;color:#ffffff;text-decoration:none;">
                      Login to Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <div style="background:#fff3cd;border:1px solid #ffeeba;border-radius:8px;padding:12px 16px;">
                <p style="margin:0;font-size:13px;color:#856404;line-height:1.6;">
                  ⚠️ For security reasons, please change your password immediately after logging in.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #eeeeee;padding:20px 48px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;">
                © ${year} Claret Admin System. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
};