import fs from "node:fs";
import path from "node:path";

function readEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
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
  
  try {
    const result = await db.execute(`
      SELECT id, email, name, role, 
        CASE WHEN password_hash IS NOT NULL THEN '✓ Has password' ELSE '✗ NO PASSWORD' END as pwd_status,
        salon_id
      FROM users 
      LIMIT 5
    `);
    
    console.log("\n=== USERS IN DATABASE ===");
    if (result.rows.length === 0) {
      console.log("No users found! You need to register first.");
    } else {
      console.table(result.rows);
    }
    console.log("\n=== DIAGNOSIS ===");
    const withPassword = result.rows.filter((r: any) => r.pwd_status.includes("✓"));
    const withoutPassword = result.rows.filter((r: any) => r.pwd_status.includes("✗"));
    console.log(`Users with password: ${withPassword.length}`);
    console.log(`Users WITHOUT password: ${withoutPassword.length}`);
    
    if (withPassword.length === 0 && result.rows.length > 0) {
      console.log("\n⚠️  All existing users were created BEFORE password_hash column was added.");
      console.log("You need to REGISTER a NEW owner account at /register");
    }
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

main();
