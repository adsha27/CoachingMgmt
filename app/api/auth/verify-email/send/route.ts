import { NextRequest, NextResponse } from "next/server";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { issueVerificationCode, CODE_TTL_MINUTES } from "@/lib/email-verification";
import { sendEmail } from "@/lib/email";
import { render } from "@react-email/render";
import { VerifyEmailEmail, verifyEmailText } from "@/lib/emails/verify-email";
import { prisma } from "@/lib/prisma";

// Sends a verification code to the signed-in user's own email. The recipient
// comes from the session, never the request body, so this can't be used to mail
// arbitrary addresses or probe which accounts exist.
export async function POST(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!user.email) return NextResponse.json({ error: "No email on this account" }, { status: 400 });

  const fresh = await prisma.user.findUnique({ where: { id: user.id }, select: { emailVerifiedAt: true } });
  if (fresh?.emailVerifiedAt) return NextResponse.json({ ok: true, alreadyVerified: true });

  const issued = await issueVerificationCode(user.id);
  if (!issued.ok) {
    return NextResponse.json(
      { error: `Please wait ${issued.retryAfterSeconds}s before requesting another code.` },
      { status: 429 },
    );
  }

  try {
    const props = { name: user.name ?? "there", code: issued.code, expiresMinutes: CODE_TTL_MINUTES };
    await sendEmail({
      to: user.email,
      subject: "Confirm your email",
      html: await render(VerifyEmailEmail(props) as React.ReactElement),
      text: verifyEmailText(props),
    });
  } catch {
    return NextResponse.json({ error: "Could not send the email. Try again shortly." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
