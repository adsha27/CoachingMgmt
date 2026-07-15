import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCode, hashCode, normalisePhone, sendOtp, OTP_TTL_MINUTES, OTP_RATE_LIMIT, OTP_WINDOW_MINUTES } from "@/lib/otp";

export async function POST(req: NextRequest) {
  const body = await req.json() as { phone?: string; email?: string };
  const phone = normalisePhone(body.phone ?? "");
  if (!phone) {
    return NextResponse.json({ error: "Valid 10-digit Indian mobile number required" }, { status: 400 });
  }

  // Rate limit: 3 OTP requests per phone per hour
  const windowStart = new Date(Date.now() - OTP_WINDOW_MINUTES * 60 * 1000);
  const recentCount = await prisma.otpCode.count({
    where: { phone, createdAt: { gte: windowStart } },
  });
  if (recentCount >= OTP_RATE_LIMIT) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Look up user — respond identically whether phone exists or not (no enumeration)
  const user = await prisma.user.findUnique({ where: { phone } });

  const fixedDevPhone = process.env.DEV_FIXED_OTP_PHONE ?? "9999999999";
  const fixedDevCode = process.env.DEV_FIXED_OTP_CODE ?? "123456";
  const isDevFixed = process.env.NODE_ENV !== "production" && phone === fixedDevPhone;

  // AUTH_MODE=email delivers the code by email, but a brand-new phone has no
  // User row yet (and thus no email on file) — ask the client to collect one
  // before we generate a code that can never be delivered. The fixed dev/test
  // phone is exempt — its code is already known, delivery is irrelevant.
  const deliveryEmail = user?.email ?? body.email?.trim();
  if (!isDevFixed && (process.env.AUTH_MODE ?? "phone") === "email" && !deliveryEmail) {
    return NextResponse.json({ needs_email: true });
  }
  const code = isDevFixed ? fixedDevCode : generateCode();
  const codeHash = await hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otpCode.create({ data: { phone, codeHash, expiresAt } });

  try {
    await sendOtp(phone, code, deliveryEmail);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "OTP delivery unavailable";
    // Misconfigured SMS provider — tell the client rather than silently failing
    if (msg.includes("not configured")) {
      return NextResponse.json({ error: "SMS service not configured. Contact support." }, { status: 503 });
    }
    console.error("OTP send failed:", err);
  }

  return NextResponse.json({ ok: true });
}
