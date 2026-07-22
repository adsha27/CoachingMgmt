import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { createResetToken, RESET_TOKEN_TTL_MINUTES } from "@/lib/password-reset";
import { sendEmail } from "@/lib/email";
import { render } from "@react-email/render";
import { PasswordResetEmail, passwordResetText } from "@/lib/emails/password-reset";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://novusclasses.in";

// Admin sends a password reset link to a user who is locked out. This reuses
// the same single-use token as the self-service flow rather than setting a
// password the admin could read: an admin never needs to know a user's password.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = Number((await params).id);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, password: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.email) {
    return NextResponse.json({ error: "That account has no email address to send to." }, { status: 400 });
  }

  const raw = await createResetToken(user.id);
  const resetUrl = `${BASE}/reset-password?token=${raw}`;

  try {
    const props = { name: user.name ?? "there", resetUrl, expiresMinutes: RESET_TOKEN_TTL_MINUTES };
    await sendEmail({
      to: user.email,
      subject: "Reset your Novus Classes password",
      html: await render(PasswordResetEmail(props) as React.ReactElement),
      text: passwordResetText(props),
    });
  } catch {
    return NextResponse.json({ error: "Could not send the email. Check the address and try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, sentTo: user.email });
}
