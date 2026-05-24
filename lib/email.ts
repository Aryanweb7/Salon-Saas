interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
}

interface SendAppointmentConfirmationEmailParams {
  to: string;
  customerName: string;
  salonName: string;
  serviceName: string;
  appointmentAt: Date;
  durationMinutes: number;
}

interface SendMarketingEmailParams {
  to: string;
  customerName: string;
  salonName: string;
  title: string;
  message: string;
}

const DEFAULT_EMAIL_FROM = "SalonFlow <noreply@salonflow.co.in>";

export async function sendPasswordResetEmail({ to, resetUrl }: SendPasswordResetEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM;

  if (!apiKey) {
    throw new Error("Email service is not configured. Set RESEND_API_KEY.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Reset your SalonFlow password",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
          <h2>Reset your SalonFlow password</h2>
          <p>Click the button below to reset your password. This link expires in 30 minutes.</p>
          <p>
            <a href="${resetUrl}" style="display:inline-block;background:#111;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">
              Reset password
            </a>
          </p>
          <p>If the button does not work, copy and paste this link into your browser:</p>
          <p style="word-break:break-all">${resetUrl}</p>
        </div>
      `,
      text: `Reset your SalonFlow password: ${resetUrl}\n\nThis link expires in 30 minutes.`,
    }),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message ?? "Failed to send password reset email");
  }
}

export async function sendAppointmentConfirmationEmail({
  to,
  customerName,
  salonName,
  serviceName,
  appointmentAt,
  durationMinutes,
}: SendAppointmentConfirmationEmailParams) {
  const appointmentDate = appointmentAt.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  await sendEmail({
    to,
    subject: "Salon Appointment Confirmed",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>Appointment Confirmed</h2>
        <p>Hello ${escapeHtml(customerName)},</p>
        <p>Your appointment at ${escapeHtml(salonName)} is confirmed.</p>
        <p><strong>Service:</strong> ${escapeHtml(serviceName)}</p>
        <p><strong>Date & time:</strong> ${escapeHtml(appointmentDate)}</p>
        <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
      </div>
    `,
    text: `Hello ${customerName}, your appointment at ${salonName} is confirmed for ${appointmentDate}. Service: ${serviceName}. Duration: ${durationMinutes} minutes.`,
  });
}

export async function sendMarketingEmail({
  to,
  customerName,
  salonName,
  title,
  message,
}: SendMarketingEmailParams) {
  await sendEmail({
    to,
    subject: title,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <div style="border:1px solid #eee;border-radius:16px;padding:24px;max-width:560px">
          <p style="margin:0 0 8px;color:#666;font-size:13px">${escapeHtml(salonName)}</p>
          <h2 style="margin:0 0 16px">${escapeHtml(title)}</h2>
          <p>Hello ${escapeHtml(customerName)},</p>
          <div>${escapeHtml(message).replace(/\n/g, "<br />")}</div>
        </div>
      </div>
    `,
    text: `Hello ${customerName},\n\n${message}\n\n${salonName}`,
  });
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM;

  if (!apiKey) {
    throw new Error("Email service is not configured. Set RESEND_API_KEY.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message ?? "Failed to send email");
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
