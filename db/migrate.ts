import fs from "node:fs";
import path from "node:path";

import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { drizzle } from "drizzle-orm/postgres-js";

function readEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  readEnvFile();
  const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is required.");
  }

  const client = postgres(databaseUrl, { max: 1, ssl: "require" });
  const db = drizzle(client);

  await migrate(db, { migrationsFolder: "./drizzle" });
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
