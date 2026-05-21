export const INDIA_TIME_ZONE = "Asia/Kolkata";

const INDIA_OFFSET_MS = 5.5 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

export function getIndiaDayBounds(date = new Date()) {
  const indiaDate = new Date(date.getTime() + INDIA_OFFSET_MS);
  const start =
    Date.UTC(indiaDate.getUTCFullYear(), indiaDate.getUTCMonth(), indiaDate.getUTCDate()) - INDIA_OFFSET_MS;

  return {
    start: new Date(start),
    end: new Date(start + DAY_MS),
  };
}

export function getIndiaDateKey(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: INDIA_TIME_ZONE });
}

export function getIndiaTimeInputValue(date: Date) {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: INDIA_TIME_ZONE,
  });
}

export function formatAppointmentTime(date: Date) {
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: INDIA_TIME_ZONE });
}

export function parseIndiaDateTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  if (![year, month, day, hour, minute].every(Number.isFinite)) {
    return new Date(Number.NaN);
  }

  return new Date(Date.UTC(year, month - 1, day, hour, minute) - INDIA_OFFSET_MS);
}
