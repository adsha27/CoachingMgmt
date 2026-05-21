import bcryptjs from "bcryptjs";
import crypto from "crypto";

export function generateCode(): string {
  return crypto.randomInt(100_000, 1_000_000).toString();
}

export async function hashCode(code: string): Promise<string> {
  return bcryptjs.hash(code, 10);
}

export async function verifyCode(code: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(code, hash);
}

export const OTP_TTL_MINUTES = 10;
export const OTP_RATE_LIMIT = 5;        // max requests per window
export const OTP_WINDOW_MINUTES = 15;   // rate-limit window
