import crypto from "node:crypto";

export function createPasswordResetToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashPasswordResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetExpiry() {
  return new Date(Date.now() + 1000 * 60 * 30);
}
