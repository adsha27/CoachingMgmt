import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";

// One-time: set the admin's password hash, since this sandbox/network can't
// reach the Postgres port directly to run this locally. The password/lockout
// columns themselves come from a real Prisma migration (CI), not this route.
// Protected by a secret set only for this purpose — remove BOOTSTRAP_SECRET
// once used.
export async function POST(req: NextRequest) {
  const secret = process.env.BOOTSTRAP_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  const hash = await bcryptjs.hash(password, 10);
  const user = await prisma.user.update({
    where: { email },
    data: { password: hash, loginAttempts: 0, lockedUntil: null },
  });

  return NextResponse.json({ ok: true, id: user.id });
}
