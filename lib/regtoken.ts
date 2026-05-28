import crypto from "crypto";

const SECRET = process.env.REGISTRATION_TOKEN_SECRET ?? process.env.CRON_SECRET ?? "dev-reg-secret";
const TTL_MS = 10 * 60 * 1000;

export function createRegToken(phone: string): string {
  const payload = Buffer.from(JSON.stringify({ phone, exp: Date.now() + TTL_MS })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyRegToken(token: string): { phone: string } | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig, "base64url"), Buffer.from(expected, "base64url"))) return null;
  } catch {
    return null;
  }
  const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { phone: string; exp: number };
  if (data.exp < Date.now()) return null;
  return { phone: data.phone };
}
