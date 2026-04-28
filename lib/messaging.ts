export type WhatsAppProvider = "twilio" | "interakt" | "wati";

export interface MessagePayload {
  to: string;
  templateKey: string;
  variables: Record<string, string>;
}

export async function sendWhatsAppMessage(provider: WhatsAppProvider, payload: MessagePayload) {
  return {
    provider,
    payload,
    status: "queued",
    referenceId: `msg_${provider}_${Date.now()}`,
  };
}
