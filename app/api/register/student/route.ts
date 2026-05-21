import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as {
    name?: string;
    email?: string;
    phone?: string;
    targetExam?: string;
  };

  const { name, email, phone } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!email?.includes("@")) return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  if (!phone?.match(/^\d{10}$/)) return NextResponse.json({ error: "10-digit phone required" }, { status: 400 });

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });
  if (existing) {
    return NextResponse.json({ error: "Email or phone already registered" }, { status: 409 });
  }

  await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone,
      role: "STUDENT",
      status: "INACTIVE", // pending admin approval
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
