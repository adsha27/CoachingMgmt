import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { normalisePhone, generateCode, hashCode, sendOtp, OTP_TTL_MINUTES } from "@/lib/otp";

export async function GET(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parents = await prisma.parentAccess.findMany({
    where: { studentId: user.id },
    select: { id: true, parentName: true, parentPhone: true, parentEmail: true, verified: true, lastAccessedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(parents);
}

export async function POST(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { parentName?: string; parentPhone?: string; parentEmail?: string };
  const { parentName, parentPhone, parentEmail } = body;

  if (!parentName?.trim()) return NextResponse.json({ error: "parentName required" }, { status: 400 });
  if (!parentPhone) return NextResponse.json({ error: "parentPhone required" }, { status: 400 });

  const phone = normalisePhone(parentPhone);
  if (!phone) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });

  // Check if already added
  const existing = await prisma.parentAccess.findFirst({
    where: { studentId: user.id, parentPhone: phone },
  });
  if (existing) {
    return NextResponse.json({ error: "This parent is already added" }, { status: 409 });
  }

  const access = await prisma.parentAccess.create({
    data: {
      studentId: user.id,
      parentName: parentName.trim(),
      parentPhone: phone,
      parentEmail: parentEmail?.trim() || null,
      verified: false,
    },
  });

  // Send OTP to parent's phone
  const code = generateCode();
  const hash = await hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { phone, codeHash: hash, expiresAt },
  });

  await sendOtp(phone, code, parentEmail?.trim() || undefined);

  return NextResponse.json({ id: access.id, parentName: access.parentName }, { status: 201 });
}
