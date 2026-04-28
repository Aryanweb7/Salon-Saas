import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import * as schema from "@/db/schema";

const databaseUrl = process.env.DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is not set.");
}

const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });
