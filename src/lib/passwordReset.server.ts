import crypto from "node:crypto";
import { getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";

type ResetRecord = { otpHash: string; expiresAt: number; attempts: number };

function resetKey(email: string) {
  return `password_reset_${crypto.createHash("sha256").update(email).digest("hex")}`;
}

function otpHash(email: string, otp: string) {
  return crypto.createHash("sha256").update(`${email}:${otp}`).digest("hex");
}

export async function createPasswordResetOtp(email: string) {
  const otp = crypto.randomInt(100000, 1000000).toString();
  await saveMetadataToDb(resetKey(email), {
    otpHash: otpHash(email, otp),
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0,
  } satisfies ResetRecord);
  return otp;
}

export async function verifyPasswordResetOtp(email: string, otp: string, consume = false) {
  const key = resetKey(email);
  const record = (await getMetadataFromDb(key)) as ResetRecord | null;
  if (!record || record.expiresAt < Date.now() || record.attempts >= 5) return false;
  const expected = Buffer.from(record.otpHash, "hex");
  const received = Buffer.from(otpHash(email, otp), "hex");
  const valid = expected.length === received.length && crypto.timingSafeEqual(expected, received);
  if (valid && consume) await saveMetadataToDb(key, null);
  else if (!valid) await saveMetadataToDb(key, { ...record, attempts: record.attempts + 1 });
  return valid;
}
