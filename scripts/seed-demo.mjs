import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
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

const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is required for seeding.");
}

const sql = postgres(databaseUrl, { ssl: "require" });

async function main() {
  await sql`
    insert into salons (id, name, slug, city, plan_id, status, read_only_mode, mrr)
    values ('11111111-1111-1111-1111-111111111111', 'Glow Studio', 'glow-studio', 'Mumbai', 'pro', 'active', false, 1999)
    on conflict (id) do nothing
  `;

  await sql`
    insert into users (id, clerk_user_id, salon_id, email, name, role)
    values
      ('00000000-0000-0000-0000-000000000002', 'clerk_seed_owner', '11111111-1111-1111-1111-111111111111', 'owner@glowstudio.in', 'Ananya Kapoor', 'SALON_OWNER'),
      ('00000000-0000-0000-0000-000000000001', 'clerk_seed_admin', null, 'owner@salonflow.in', 'Platform Owner', 'SUPER_ADMIN')
    on conflict (id) do nothing
  `;

  await sql`
    update salons
    set owner_user_id = '00000000-0000-0000-0000-000000000002'
    where id = '11111111-1111-1111-1111-111111111111'
  `;

  await sql`
    insert into subscriptions (salon_id, plan_id, status, current_period_start, current_period_end)
    values ('11111111-1111-1111-1111-111111111111', 'pro', 'active', now(), now() + interval '30 day')
  `;

  await sql`
    insert into staff (salon_id, name, role_label, commission_rate, attendance_rate, sales_total)
    values
      ('11111111-1111-1111-1111-111111111111', 'Aman', 'Senior Stylist', 18, 96, 58000),
      ('11111111-1111-1111-1111-111111111111', 'Riya', 'Color Specialist', 20, 92, 72000)
  `;

  await sql`
    insert into customers (salon_id, name, phone, gender)
    values
      ('11111111-1111-1111-1111-111111111111', 'Rahul Verma', '+919876543210', 'Male'),
      ('11111111-1111-1111-1111-111111111111', 'Priya Shah', '+919876543211', 'Female')
  `;

  console.log("Seeded SalonFlow demo records into Neon.");
  await sql.end();
}

main().catch(async (error) => {
  console.error(error);
  await sql.end();
  process.exit(1);
});
