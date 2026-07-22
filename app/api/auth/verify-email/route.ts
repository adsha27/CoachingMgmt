import { NextRequest, NextResponse } from "next/server";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { verifyCode } from "@/lib/email-verification";

const MESSAGES: Record<string, string> = {
  no_code: "Request a new code to continue.",
  expired: "That code has expired. Request a new one.",
  too_many_attempts: "Too many incorrect attempts. Request a new code.",
  incorrect: "That code isn't right.",
};

export async function POST(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { code } = await req.json().catch(() => ({})) as { code?: string };
  if (!code || !/^\d{6}$/.test(code.trim())) {
    return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
  }

  const result = await verifyCode(user.id, code);
  if (!result.ok) {
    return NextResponse.json({ error: MESSAGES[result.reason] }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
