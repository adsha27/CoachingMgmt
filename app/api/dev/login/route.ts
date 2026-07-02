import { NextRequest, NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, dashboardFor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const email = req.nextUrl.searchParams.get("email") ?? "admin@example.test";
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Active user not found" }, { status: 404 });
  }

  const sessionId = await createSession(user.id);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const res = NextResponse.redirect(new URL(dashboardFor(user.role), req.url), { status: 303 });
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    expires: expiresAt,
    path: "/",
  });
  return res;
}
