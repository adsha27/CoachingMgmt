import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, email } = body as {
    name: string;
    phone: string;
    email: string;
  };

  if (!name || !phone || !email) {
    return NextResponse.json(
      { error: "name, phone, and email are required" },
      { status: 400 }
    );
  }

  const student = await prisma.user.create({
    data: { name, phone, email, role: "STUDENT" },
  });

  return NextResponse.json({ student }, { status: 201 });
}
