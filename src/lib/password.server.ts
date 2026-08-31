import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, storedHash: string): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (/^\$2[aby]\$/.test(storedHash)) {
    return { valid: await bcrypt.compare(password, storedHash), needsRehash: false };
  }

  const legacySha256 = crypto.createHash("sha256").update(password).digest("hex");
  const valid = storedHash === legacySha256 || storedHash === password;
  return { valid, needsRehash: valid };
}
