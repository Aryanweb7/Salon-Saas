import { desc } from "drizzle-orm";

import { db } from "@/db";
import { supportTickets } from "@/db/schema";
import { fallbackSupportTickets } from "@/lib/fallback-data";

export async function listSupportTickets() {
  try {
    const rows = await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)).limit(20);

    return rows.map((row) => ({
      salon: row.requesterName ?? "Salon owner",
      issue: row.subject,
      priority: row.priority === "high" ? "High" : row.priority === "medium" ? "Medium" : "Low",
    }));
  } catch {
    return fallbackSupportTickets;
  }
}
