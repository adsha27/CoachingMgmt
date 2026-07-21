import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createResetToken, RESET_TOKEN_TTL_MINUTES } from "@/lib/password-reset";
import { sendEmail } from "@/lib/email";
import { render } from "@react-email/render";
import { PasswordResetEmail, passwordResetText } from "@/lib/emails/password-reset";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://novusclasses.in";

// Always responds 200 with the same generic message so it never reveals whether
// an email is registered. A reset link is only sent when the account actually
// exists and has a password set.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { email?: string };
  const email = body.email?.trim().toLowerCase();

  const generic = NextResponse.json({
    ok: true,
    message: "If an account exists for that email, a reset link is on its way.",
  });

  if (!email || !email.includes("@")) return generic;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, password: true },
  });
  if (!user || !user.password || !user.email) return generic;

  const raw = await createResetToken(user.id);
  const resetUrl = `${BASE}/reset-password?token=${raw}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your Novus Classes password",
      html: await render(PasswordResetEmail({ name: user.name, resetUrl, expiresMinutes: RESET_TOKEN_TTL_MINUTES }) as React.ReactElement),
      text: passwordResetText({ name: user.name, resetUrl, expiresMinutes: RESET_TOKEN_TTL_MINUTES }),
    });
  } catch {
    // Don't leak delivery failure to the caller — the generic response stands.
  }

  return generic;
}
