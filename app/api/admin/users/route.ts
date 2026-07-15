import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { normalisePhone } from "@/lib/otp";

export async function POST(req: NextRequest) {
  const admin = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as { name?: string; phone?: string; email?: string; role?: string };
  const name = body.name?.trim();
  const phone = normalisePhone(body.phone ?? "");
  const email = body.email?.trim();
  const role = body.role;

  if (!name || !phone || !email?.includes("@") || !role) {
    return NextResponse.json({ error: "name, phone, email, and role required" }, { status: 400 });
  }
  if (!["TEACHER", "STUDENT"].includes(role)) {
    return NextResponse.json({ error: "role must be TEACHER or STUDENT" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({ where: { OR: [{ phone }, { email }] } });
  if (existing) {
    return NextResponse.json({ error: "Phone or email already registered" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { name, phone, email, role: role as "TEACHER" | "STUDENT" },
  });

  return NextResponse.json({ ok: true, id: user.id }, { status: 201 });
}
