import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { consumeResetToken } from "@/lib/password-reset";

const MIN_PASSWORD = 8;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { token?: string; password?: string };
  const token = body.token?.trim();
  const password = body.password ?? "";

  if (!token) {
    return NextResponse.json({ error: "Missing reset token." }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD} characters.` }, { status: 400 });
  }

  const userId = await consumeResetToken(token);
  if (userId === null) {
    return NextResponse.json({ error: "This reset link is invalid or has expired. Request a new one." }, { status: 400 });
  }

  // Set the new password and clear any lockout so the user can sign in right away.
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: await bcryptjs.hash(password, 10),
      loginAttempts: 0,
      lockedUntil: null,
    },
  });

  return NextResponse.json({ ok: true });
}
