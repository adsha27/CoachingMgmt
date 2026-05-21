import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

async function requireAdmin(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, name: true, email: true, phone: true, role: true, status: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
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

  let student;
  try {
    student = await prisma.user.create({
      data: { name, phone, email, role: "STUDENT" },
      select: { id: true, name: true, email: true, phone: true, role: true, status: true },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : "field";
      return NextResponse.json({ error: `A user with this ${target} already exists` }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ student }, { status: 201 });
}
