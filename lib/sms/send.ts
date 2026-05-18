import twilio from "twilio";

export type SmsSendStatus = "pending" | "sent" | "delivered" | "failed";

let cachedClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN");
  }

  if (!cachedClient) {
    cachedClient = twilio(accountSid, authToken);
  }

  return cachedClient;
}

export function normalizeSmsPhone(value: string) {
  const normalized = value.replace(/^(sms:|whatsapp:)/, "").replace(/[^\d+]/g, "");

  if (!normalized) {
    return "";
  }

  if (normalized.startsWith("+")) {
    return normalized;
  }

  const defaultCountryCode = (process.env.TWILIO_DEFAULT_COUNTRY_CODE ?? "+91").replace("+", "");
  return `+${defaultCountryCode}${normalized}`;
}

export function isValidSmsPhone(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

export function mapTwilioSmsStatus(status?: string): SmsSendStatus {
  if (status === "delivered") return "delivered";
  if (status === "sent") return "sent";
  if (status === "failed" || status === "undelivered") return "failed";
  return "pending";
}

export async function sendSMS(to: string, body: string) {
  const from = process.env.TWILIO_PHONE_NUMBER ?? process.env.TWILIO_SMS_FROM;

  if (!from) {
    throw new Error("Missing TWILIO_PHONE_NUMBER");
  }

  const normalizedTo = normalizeSmsPhone(to);

  if (!isValidSmsPhone(normalizedTo)) {
    throw new Error("Invalid phone number format");
  }

  const message = await getTwilioClient().messages.create({
    from,
    to: normalizedTo,
    body,
  });

  return {
    sid: message.sid,
    status: mapTwilioSmsStatus(message.status),
    rawStatus: message.status,
    to: normalizedTo,
  };
}
