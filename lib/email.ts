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

interface SendInvoiceEmailParams {
  to: string;
  customerName: string;
  salonName: string;
  invoiceNumber: string;
  amount: number;
  pdfBase64: string;
  pdfFileName: string;
}

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const RESEND_BATCH_URL = "https://api.resend.com/emails/batch";
const MAX_BATCH_SIZE = 100;
const MAX_RESEND_ATTEMPTS = 4;

function getEmailFrom() {
  const configuredFrom = process.env.EMAIL_FROM?.trim();

  if (!configuredFrom) {
    throw new Error("Email service is not configured. Set EMAIL_FROM.");
  }

  if (configuredFrom.includes("resend.dev")) {
    throw new Error("EMAIL_FROM must use your verified domain, not resend.dev.");
  }

  return configuredFrom;
}

function getResendApiKey() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Email service is not configured. Set RESEND_API_KEY.");
  }

  return apiKey;
}

function buildMarketingEmail({
  customerName,
  salonName,
  title,
  message,
}: Omit<SendMarketingEmailParams, "to">) {
  return {
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
  };
}

function parseRetryAfter(value: string | null) {
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(seconds * 1000, 0);

  const dateTime = Date.parse(value);
  if (Number.isFinite(dateTime)) return Math.max(dateTime - Date.now(), 0);

  return null;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resendFetch(url: string, init: RequestInit) {
  for (let attempt = 0; attempt < MAX_RESEND_ATTEMPTS; attempt += 1) {
    const response = await fetch(url, init);

    if (response.status !== 429 && response.status < 500) {
      return response;
    }

    if (attempt === MAX_RESEND_ATTEMPTS - 1) {
      return response;
    }

    const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
    const backoff = retryAfter ?? 500 * 2 ** attempt;
    await wait(backoff);
  }

  throw new Error("Failed to send email");
}

export async function sendPasswordResetEmail({ to, resetUrl }: SendPasswordResetEmailParams) {
  const apiKey = getResendApiKey();
  const from = getEmailFrom();

  const response = await resendFetch(RESEND_EMAILS_URL, {
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
  const email = buildMarketingEmail({ customerName, salonName, title, message });

  await sendEmail({
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

export async function sendMarketingEmailBatch(messages: SendMarketingEmailParams[]) {
  if (messages.length === 0) return;

  const apiKey = getResendApiKey();
  const from = getEmailFrom();

  for (let index = 0; index < messages.length; index += MAX_BATCH_SIZE) {
    const chunk = messages.slice(index, index + MAX_BATCH_SIZE);
    const payload = chunk.map((message) => {
      const email = buildMarketingEmail(message);

      return {
        from,
        to: [message.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
      };
    });

    const response = await resendFetch(RESEND_BATCH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response?.ok) {
      const error = (await response?.json().catch(() => null)) as { message?: string } | null;
      throw new Error(error?.message ?? "Failed to send email batch");
    }

    if (index + MAX_BATCH_SIZE < messages.length) {
      await wait(600);
    }
  }
}

export async function sendInvoiceEmail({
  to,
  customerName,
  salonName,
  invoiceNumber,
  amount,
  pdfBase64,
  pdfFileName,
}: SendInvoiceEmailParams) {
  const amountCopy = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

  await sendEmail({
    to,
    subject: `Your Invoice from ${salonName}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <div style="border:1px solid #eee;border-radius:16px;padding:24px;max-width:600px">
          <h2 style="margin:0 0 16px">Your invoice from ${escapeHtml(salonName)}</h2>
          <p>Hello ${escapeHtml(customerName)},</p>
          <p>Thank you for visiting ${escapeHtml(salonName)}.</p>
          <p>Please find your invoice attached.</p>
          <p><strong>Invoice Number:</strong> ${escapeHtml(invoiceNumber)}<br />
          <strong>Amount Paid:</strong> ${escapeHtml(amountCopy)}</p>
          <p>We appreciate your business and look forward to serving you again.</p>
          <p>Regards,<br />${escapeHtml(salonName)}</p>
        </div>
      </div>
    `,
    text: `Hello ${customerName},

Thank you for visiting ${salonName}.

Please find your invoice attached.

Invoice Number: ${invoiceNumber}
Amount Paid: ${amountCopy}

We appreciate your business and look forward to serving you again.

Regards,
${salonName}`,
    attachments: [
      {
        filename: pdfFileName,
        content: pdfBase64,
      },
    ],
  });
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; content: string }>;
}) {
  const apiKey = getResendApiKey();
  const from = getEmailFrom();

  const response = await resendFetch(RESEND_EMAILS_URL, {
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
      attachments: params.attachments,
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
