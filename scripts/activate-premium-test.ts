import fs from "node:fs";
import path from "node:path";
import { desc, eq } from "drizzle-orm";

function readEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

readEnvFile();

async function main() {
  const { db } = await import("@/db");
  const { salons, subscriptions, users } = await import("@/db/schema");

  const email = process.argv[2] ?? "webaryan102@gmail.com";

  const [user] = await db
    .select({ salonId: users.salonId, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user?.salonId) {
    throw new Error(`No salon found for ${email}`);
  }

  const [subscription] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.salonId, user.salonId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (subscription) {
    await db
      .update(subscriptions)
      .set({
        planId: "premium",
        status: "active",
        razorpaySubscriptionId: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: nextBillingDate,
        graceEndsAt: null,
        canceledAt: null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));
  } else {
    await db.insert(subscriptions).values({
      salonId: user.salonId,
      planId: "premium",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: nextBillingDate,
    });
  }

  await db
    .update(salons)
    .set({
      planId: "premium",
      status: "active",
      readOnlyMode: false,
      nextBillingDate,
      updatedAt: new Date(),
    })
    .where(eq(salons.id, user.salonId));

  console.log(`Premium active for ${user.email} (${user.salonId}) until ${nextBillingDate.toISOString()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
