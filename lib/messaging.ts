export type WhatsAppProvider = "meta" | "twilio" | "interakt" | "wati";
export type SmsProvider = "twilio";

export const WHATSAPP_PROVIDER: WhatsAppProvider = "meta";
export const SMS_PROVIDER: SmsProvider = "twilio";

export interface MessagePayload {
  to: string;
  templateKey: string;
  variables: Record<string, string>;
}

export async function sendWhatsAppMessage(provider: WhatsAppProvider, payload: MessagePayload) {
  if (provider === "meta") {
    return sendMetaWhatsAppMessage(payload);
  }

  if (provider === "twilio") {
    return sendTwilioWhatsAppMessage(payload);
  }

  throw new Error(`Unsupported WhatsApp provider: ${provider}`);
}

export async function sendSmsMessage(provider: SmsProvider, payload: MessagePayload) {
  if (provider !== "twilio") {
    throw new Error(`Unsupported SMS provider: ${provider}`);
  }

  return sendTwilioSmsMessage(payload);
}

async function sendTwilioWhatsAppMessage(payload: MessagePayload) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = toWhatsAppAddress(process.env.TWILIO_WHATSAPP_FROM ?? "+14155238886");

  if (!accountSid || !authToken) {
    throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN");
  }

  const to = toWhatsAppAddress(payload.to);
  const body = renderWhatsAppTemplate(payload.templateKey, payload.variables);
  const params = new URLSearchParams({
    From: from,
    To: to,
    Body: body,
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.message ?? "Failed to send Twilio WhatsApp message");
  }

  return {
    provider: "twilio" as const,
    payload: result as Record<string, unknown>,
    status: result?.status ?? "queued",
    referenceId: result?.sid ?? `msg_twilio_${Date.now()}`,
  };
}

async function sendMetaWhatsAppMessage(payload: MessagePayload) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error("Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
  }

  const to = toMetaWhatsAppNumber(payload.to);
  const body = renderWhatsAppTemplate(payload.templateKey, payload.variables);

  if (!to) {
    throw new Error("Customer phone number is required");
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body,
      },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error?.message ?? "Failed to send WhatsApp message");
  }

  const messageId = result?.messages?.[0]?.id;

  return {
    provider: "meta" as const,
    payload: result as Record<string, unknown>,
    status: "sent",
    referenceId: messageId ?? `msg_meta_${Date.now()}`,
  };
}

async function sendTwilioSmsMessage(payload: MessagePayload) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = toPhoneNumber(process.env.TWILIO_SMS_FROM ?? process.env.TWILIO_PHONE_NUMBER ?? "");

  if (!accountSid || !authToken) {
    throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN");
  }

  if (!from) {
    throw new Error("Missing TWILIO_SMS_FROM or TWILIO_PHONE_NUMBER");
  }

  const to = toPhoneNumber(payload.to);
  const body = renderMessageTemplate(payload.templateKey, payload.variables);
  const params = new URLSearchParams({
    From: from,
    To: to,
    Body: body,
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.message ?? "Failed to send Twilio SMS message");
  }

  return {
    provider: "twilio" as const,
    payload: result as Record<string, unknown>,
    status: result?.status ?? "queued",
    referenceId: result?.sid ?? `msg_twilio_${Date.now()}`,
  };
}

function toWhatsAppAddress(value: string) {
  const normalized = value.replace(/[\s()-]/g, "");

  if (normalized.startsWith("whatsapp:")) {
    return normalized;
  }

  if (normalized.startsWith("+")) {
    return `whatsapp:${normalized}`;
  }

  const defaultCountryCode = process.env.TWILIO_DEFAULT_COUNTRY_CODE ?? "+91";
  return `whatsapp:${defaultCountryCode}${normalized}`;
}

function toMetaWhatsAppNumber(value: string) {
  const normalized = value.replace(/^(sms:|whatsapp:)/, "").replace(/[^\d+]/g, "");

  if (!normalized) {
    return "";
  }

  if (normalized.startsWith("+")) {
    return normalized.slice(1);
  }

  const defaultCountryCode = (process.env.WHATSAPP_DEFAULT_COUNTRY_CODE ?? process.env.TWILIO_DEFAULT_COUNTRY_CODE ?? "+91").replace("+", "");
  return `${defaultCountryCode}${normalized}`;
}

function toPhoneNumber(value: string) {
  const normalized = value.replace(/^(sms:|whatsapp:)/, "").replace(/[\s()-]/g, "");

  if (!normalized) {
    return "";
  }

  if (normalized.startsWith("+")) {
    return normalized;
  }

  const defaultCountryCode = process.env.TWILIO_DEFAULT_COUNTRY_CODE ?? "+91";
  return `${defaultCountryCode}${normalized}`;
}

function renderWhatsAppTemplate(templateKey: string, variables: Record<string, string>) {
  return renderMessageTemplate(templateKey, variables);
}

function renderMessageTemplate(templateKey: string, variables: Record<string, string>) {
  const customerName = variables.customer_name || "there";

  if (templateKey === "appointment-reminder") {
    return `Hi ${customerName}, this is a reminder for your appointment at ${variables.appointment_time || "your scheduled time"}. See you soon.`;
  }

  if (templateKey === "revisit-30-day") {
    return `Hi ${customerName}, it has been a while since your last ${variables.last_service || "service"}. Book your next visit when convenient.`;
  }

  if (templateKey === "birthday-offer") {
    return `Happy birthday ${customerName}! We have a special birthday offer waiting for you at the salon.`;
  }

  if (templateKey === "customer-welcome") {
    return `Hi ${customerName}, thanks for visiting ${variables.salon_name || "our salon"}! We are happy to have you.`;
  }

  if (templateKey === "customer-broadcast") {
    return variables.message || "Thank you for choosing us.";
  }

  return `Hi ${customerName}, ${variables.message || "thank you for choosing us."}`;
}
