import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { render } from "@react-email/render";
import { TeacherVerifiedEmail, teacherVerifiedText } from "@/lib/emails/teacher-verified";
import { TeacherRejectedEmail, teacherRejectedText } from "@/lib/emails/teacher-rejected";

type Action = "APPROVE" | "REJECT" | "MORE_INFO_REQUESTED";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const teacherId = Number(id);
  const { action, reason } = await req.json() as { action?: Action; reason?: string };

  if (!action || !["APPROVE", "REJECT", "MORE_INFO_REQUESTED"].includes(action)) {
    return NextResponse.json({ error: "action must be APPROVE | REJECT | MORE_INFO_REQUESTED" }, { status: 400 });
  }
  if ((action === "REJECT" || action === "MORE_INFO_REQUESTED") && !reason?.trim()) {
    return NextResponse.json({ error: "reason required for REJECT and MORE_INFO_REQUESTED" }, { status: 400 });
  }

  const profile = await prisma.teacherProfile.findUnique({
    where: { teacherId },
    include: { teacher: { select: { name: true, email: true } } },
  });
  if (!profile) {
    return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
  }

  const verifyStatus =
    action === "APPROVE" ? "VERIFIED" :
    action === "REJECT" ? "REJECTED" :
    "MORE_INFO_REQUESTED";

  const updated = await prisma.teacherProfile.update({
    where: { teacherId },
    data: {
      verifyStatus,
      rejectionReason: reason?.trim() ?? null,
    },
  });

  // Send notification email (best-effort)
  const teacherName = profile.teacher.name ?? "Teacher";
  const teacherEmail = profile.teacher.email;
  if (teacherEmail) {
    (async () => {
      if (action === "APPROVE") {
        await sendEmail({
          to: teacherEmail,
          subject: "Your teacher profile has been verified",
          html: await render(TeacherVerifiedEmail({ teacherName }) as React.ReactElement),
          text: teacherVerifiedText({ teacherName }),
        });
      } else {
        const rejProps = { teacherName, action: action as "REJECTED" | "MORE_INFO_REQUESTED", reason: reason?.trim() };
        await sendEmail({
          to: teacherEmail,
          subject: action === "REJECT" ? "Teacher profile not approved" : "More information needed for your profile",
          html: await render(TeacherRejectedEmail(rejProps) as React.ReactElement),
          text: teacherRejectedText(rejProps),
        });
      }
    })().catch(() => {});
  }

  return NextResponse.json({ ok: true, verifyStatus: updated.verifyStatus });
}
