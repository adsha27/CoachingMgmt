import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const invite = await prisma.inviteLink.findUnique({
    where: { code },
    include: {
      teacher: { select: { id: true, name: true } },
      groupCourse: { select: { id: true, title: true, subject: true, status: true } },
      oneOnOnePackage: { select: { id: true, title: true, subject: true, status: true } },
    },
  });

  if (!invite) notFound();
  if (invite.expiresAt < new Date()) {
    return (
      <main className="max-w-md mx-auto py-20 px-4 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Link expired</h1>
        <p className="text-sm text-gray-500 mb-6">This invite link has expired. Ask your teacher for a new one.</p>
        <Link href="/browse" className="text-orange-600 hover:underline text-sm">Browse all teachers</Link>
      </main>
    );
  }

  const target = invite.groupCourse ?? invite.oneOnOnePackage;
  if (!target) notFound();

  const isListed = target.status === "LISTED";
  const user = await getCurrentUser();

  // If not logged in, redirect to login with `next` pointing back here
  if (!user) redirect(`/login?next=/invite/${code}`);

  // If logged in as STUDENT, redirect directly to the booking page
  if (user.role === "STUDENT") {
    if (invite.groupCourseId) redirect(`/courses/${invite.groupCourseId}/book`);
    if (invite.oneOnOnePackageId) redirect(`/packages/${invite.oneOnOnePackageId}/book`);
  }

  // For teachers/admins or when the course isn't listed — show info page
  const bookPath = invite.groupCourseId
    ? `/courses/${invite.groupCourseId}/book`
    : `/packages/${invite.oneOnOnePackageId}/book`;

  return (
    <main className="max-w-md mx-auto py-20 px-4 text-center">
      <p className="text-sm text-gray-500 mb-1">You&apos;ve been invited by</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{invite.teacher.name}</h1>
      <p className="text-lg text-gray-700 mb-6">{target.title} · {target.subject}</p>

      {isListed ? (
        <Link
          href={bookPath}
          className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
        >
          Enrol now
        </Link>
      ) : (
        <p className="text-sm text-gray-500">This course is not currently accepting enrolments.</p>
      )}
    </main>
  );
}
