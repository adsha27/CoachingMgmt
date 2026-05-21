import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import React from "react";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { generateCode, hashCode, OTP_TTL_MINUTES, OTP_RATE_LIMIT, OTP_WINDOW_MINUTES } from "@/lib/otp";
import { OtpCodeEmail, otpCodeText } from "@/lib/emails/otp-code";

export async function POST(req: NextRequest) {
  const { email } = await req.json() as { email: string };
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  // Rate limit: max OTP_RATE_LIMIT requests per OTP_WINDOW_MINUTES per email
  const windowStart = new Date(Date.now() - OTP_WINDOW_MINUTES * 60 * 1000);
  const recentCount = await prisma.otpCode.count({
    where: { email, createdAt: { gte: windowStart } },
  });
  if (recentCount >= OTP_RATE_LIMIT) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Check user exists — but respond identically to prevent enumeration
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && user.status === "ACTIVE") {
    const code = generateCode();
    const codeHash = await hashCode(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await prisma.otpCode.create({ data: { email, codeHash, expiresAt } });

    const html = await render(
      React.createElement(OtpCodeEmail, { code, expiresMinutes: OTP_TTL_MINUTES })
    );
    await sendEmail({
      to: email,
      subject: "Your login code",
      html,
      text: otpCodeText(code, OTP_TTL_MINUTES),
    }).catch((err) => {
      console.error("OTP email failed:", err);
    });
  }

  // Always return ok — no enumeration
  return NextResponse.json({ ok: true });
}
