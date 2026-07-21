import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { render } from "@react-email/render";
import { TeacherVerifiedEmail, teacherVerifiedText } from "@/lib/emails/teacher-verified";

// Admin approves or rejects a self-registered teacher account. Approval is the
// single vetting decision: it activates the account (login unblocked) AND marks
// the profile VERIFIED (listed on the marketplace) in one step — the operator
// vets teachers offline, so a second "verify" click was pure friction. The
// granular /verify route + /admin/verification page still exist for later
// re-review (un-verify, request more info).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action } = await req.json() as { action?: "approve" | "reject" };
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const teacher = await prisma.user.findFirst({
    where: { id: Number((await params).id), role: "TEACHER", status: "PENDING" },
    select: { id: true, name: true, email: true },
  });
  if (!teacher) {
    return NextResponse.json({ error: "Pending teacher not found" }, { status: 404 });
  }

  const approved = action === "approve";

  await prisma.$transaction([
    prisma.user.update({
      where: { id: teacher.id },
      data: { status: approved ? "ACTIVE" : "SUSPENDED" },
    }),
    // updateMany is a no-op if the teacher hasn't built a profile yet — in that
    // case profile/submit auto-verifies once they do (account is now ACTIVE).
    prisma.teacherProfile.updateMany({
      where: { teacherId: teacher.id },
      data: { verifyStatus: approved ? "VERIFIED" : "REJECTED" },
    }),
  ]);

  // Notify the teacher they're live (best-effort — email is not on the
  // critical path and delivery may not be configured yet).
  if (approved && teacher.email) {
    const teacherName = teacher.name ?? "Teacher";
    const teacherEmail = teacher.email;
    (async () => {
      await sendEmail({
        to: teacherEmail,
        subject: "Your teacher profile has been verified",
        html: await render(TeacherVerifiedEmail({ teacherName }) as React.ReactElement),
        text: teacherVerifiedText({ teacherName }),
      });
    })().catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
