import { NextRequest, NextResponse } from "next/server";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sid = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sid) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const user = await getSession(sid);
  if (!user) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  return NextResponse.json(user);
}
