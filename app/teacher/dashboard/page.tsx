import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/app/_components/LogoutButton";
import AppNav from "@/app/_components/AppNav";
import AvailabilitySection from "./AvailabilitySection";
import PublishCourseButton from "./PublishCourseButton";
import ProposalsSection from "./ProposalsSection";
import ApplicationsSection from "./ApplicationsSection";
import InviteLinkButton from "./InviteLinkButton";
import MeetingLinkButton from "./MeetingLinkButton";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") redirect("/login");

  const now = new Date();
  const myId = user.id;

  const [upcoming, past, slots, groupCourses, oneOnOnePackages, pendingProposals, pendingApplications, teacherProfile] = await Promise.all([
    prisma.session.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: now },
        OR: [
          { groupCourse: { teacherId: myId } },
          { booking: { oneOnOnePackage: { teacherId: myId } } },
        ],
      },
      include: {
        groupCourse: { select: { title: true, subject: true, enrolledCount: true } },
        booking: {
          include: {
            student: { select: { name: true, email: true } },
            oneOnOnePackage: { select: { title: true, subject: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.session.findMany({
      where: {
        OR: [
          { groupCourse: { teacherId: myId } },
          { booking: { oneOnOnePackage: { teacherId: myId } } },
        ],
        AND: [{ OR: [{ status: { not: "SCHEDULED" } }, { scheduledAt: { lt: now } }] }],
      },
      include: {
        groupCourse: { select: { title: true, subject: true } },
        booking: { include: { oneOnOnePackage: { select: { title: true } } } },
        feedback: { select: { rating: true, comment: true }, take: 10 },
      },
      orderBy: { scheduledAt: "desc" },
      take: 20,
    }),
    prisma.teacherAvailability.findMany({
      where: { teacherId: myId, status: "AVAILABLE" },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    prisma.groupCourse.findMany({
      where: { teacherId: myId },
      orderBy: { createdAt: "desc" },
      include: { sessions: { take: 1, orderBy: { sessionNumber: "asc" }, select: { meetLink: true } } },
    }),
    prisma.oneOnOnePackage.findMany({
      where: { teacherId: myId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.slotProposal.findMany({
      where: {
        status: "PENDING",
        booking: { oneOnOnePackage: { teacherId: myId } },
      },
      include: {
        booking: {
          include: {
            student: { select: { name: true } },
            oneOnOnePackage: { select: { title: true, sessionDurationMinutes: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        status: "PENDING",
        OR: [
          { groupCourse: { teacherId: myId } },
          { oneOnOnePackage: { teacherId: myId } },
        ],
      },
      include: {
        student: { select: { name: true, email: true, phone: true, targetExam: true, currentClass: true } },
        groupCourse: { select: { title: true } },
        oneOnOnePackage: { select: { title: true } },
      },
      orderBy: { bookedAt: "asc" },
    }),
    prisma.teacherProfile.findUnique({ where: { teacherId: myId } }),
  ]);

  const applicationData = pendingApplications.map((b) => ({
    id: b.id,
    studentName: b.student.name,
    studentEmail: b.student.email,
    studentPhone: b.student.phone,
    targetExam: b.student.targetExam,
    currentClass: b.student.currentClass,
    classTitle: b.groupCourse?.title ?? b.oneOnOnePackage?.title ?? "Class",
    kind: b.groupCourse ? "Group" : "1-on-1",
  }));

  const proposalData = pendingProposals.map((p) => ({
    id: p.id,
    bookingId: p.bookingId,
    proposedDate: p.proposedDate.toISOString(),
    proposedStartTime: p.proposedStartTime,
    studentName: p.booking.student.name ?? "Student",
    packageTitle: p.booking.oneOnOnePackage?.title ?? "Package",
    durationMinutes: p.booking.oneOnOnePackage?.sessionDurationMinutes ?? 60,
  }));

  const verifyStatus = teacherProfile?.verifyStatus ?? "PENDING";
  const hasProfile = !!teacherProfile;
  const hasCourses = groupCourses.length > 0 || oneOnOnePackages.length > 0;
  const isVerified = verifyStatus === "VERIFIED";
  const needsAttention = verifyStatus === "REJECTED" || verifyStatus === "MORE_INFO_REQUESTED";

  // Onboarding checklist items
  const checklist = [
    { done: hasProfile, label: "Complete your profile", href: "/teacher/wizard" },
    { done: hasCourses, label: "Create a course or 1-on-1 package", href: "/teacher/courses/new" },
    { done: isVerified, label: "Get verified by the Novus Classes team", href: null },
    { done: slots.length > 0, label: "Set your weekly availability", href: null },
  ];
  const allDone = checklist.every((c) => c.done);

  return (
    <main className="min-h-screen bg-gray-50">
      <AppNav role="TEACHER" current="/teacher/dashboard" />
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-base font-bold text-gray-900">{user.name}</h1>
            <p className="text-xs text-gray-400">{user.email ?? user.phone}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/teacher/wizard"
              className="text-xs font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
              Edit profile
            </Link>
            <Link href={`/teacher/${user.id}`}
              className="text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">
              View public page
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">

        {/* ── Verification banner ─────────────────────────────────────────── */}
        {!isVerified && (
          <div className={`rounded-2xl p-4 ${
            needsAttention
              ? "bg-red-50 border border-red-200"
              : "bg-amber-50 border border-amber-200"
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">{needsAttention ? "⚠️" : "🕐"}</span>
              <div>
                <p className={`font-semibold text-sm ${needsAttention ? "text-red-800" : "text-amber-800"}`}>
                  {verifyStatus === "PENDING" && "Verification pending"}
                  {verifyStatus === "REJECTED" && "Verification rejected"}
                  {verifyStatus === "MORE_INFO_REQUESTED" && "More information needed"}
                </p>
                <p className={`text-xs mt-0.5 ${needsAttention ? "text-red-600" : "text-amber-600"}`}>
                  {verifyStatus === "PENDING" && "Your profile is under review. Verified teachers appear on the marketplace — expect 24-48 hours."}
                  {verifyStatus === "REJECTED" && "Your verification was not approved. Contact our team to understand the reasons and reapply."}
                  {verifyStatus === "MORE_INFO_REQUESTED" && "The verification team needs more details. Please update your profile with the requested information."}
                </p>
                {needsAttention && (
                  <Link href="/teacher/wizard" className="text-xs font-semibold text-red-700 underline mt-1 inline-block">
                    Update profile →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Onboarding checklist for new teachers ──────────────────────── */}
        {!allDone && (
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">Getting started</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {checklist.map((item, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i !== checklist.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    item.done ? "bg-green-500" : "bg-gray-100"
                  }`}>
                    {item.done ? (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs text-gray-300 font-bold">{i + 1}</span>
                    )}
                  </div>
                  <span className={`text-sm flex-1 ${item.done ? "text-gray-400 line-through" : "text-gray-800"}`}>
                    {item.label}
                  </span>
                  {!item.done && item.href && (
                    <Link href={item.href} className="text-xs font-semibold text-orange-600 shrink-0">
                      Start →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Upcoming sessions ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">Upcoming sessions</h2>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-5 py-8 text-center">
              <p className="text-sm text-gray-500 mb-1">No sessions scheduled yet.</p>
              <p className="text-xs text-gray-400">Sessions are booked by students via your course listings.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((s) => {
                const date = new Date(s.scheduledAt);
                const title = s.groupCourse?.title ?? s.booking?.oneOnOnePackage?.title ?? "Session";
                const subtitle = s.groupCourse
                  ? `${s.groupCourse.enrolledCount} students enrolled`
                  : s.booking?.student.name ?? "";
                return (
                  <Link
                    key={s.id}
                    href={`/teacher/sessions/${s.id}`}
                    className="block bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-orange-200 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                          {" · "}
                          {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          {" · "}
                          {s.durationMinutes} min
                        </p>
                        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {s.meetLink && (
                          <span className="text-xs bg-orange-50 text-orange-700 font-semibold px-2.5 py-1 rounded-lg">
                            Meet ready
                          </span>
                        )}
                        <span className="text-xs text-gray-400">View →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Class applications (awaiting approval) ─────────────────────── */}
        <ApplicationsSection applications={applicationData} />

        {/* ── Pending slot proposals ─────────────────────────────────────── */}
        <ProposalsSection proposals={proposalData} />

        {/* ── My Courses ────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">My courses</h2>
            <div className="flex gap-3">
              <Link href="/teacher/courses/new" className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">
                + Group
              </Link>
              <Link href="/teacher/packages/new" className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                + 1-on-1
              </Link>
            </div>
          </div>

          {groupCourses.length === 0 && oneOnOnePackages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-5 py-8 text-center">
              <p className="text-sm text-gray-500 mb-4">No courses yet.</p>
              <div className="flex gap-3 justify-center">
                <Link href="/teacher/courses/new"
                  className="text-sm font-semibold text-white bg-orange-600 px-4 py-2 rounded-xl hover:bg-orange-700 transition-colors">
                  Create group course
                </Link>
                <Link href="/teacher/packages/new"
                  className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-colors">
                  Add 1-on-1 package
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {groupCourses.map((c) => (
                <div key={`g-${c.id}`} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{c.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.subject}{c.targetExam ? ` · ${c.targetExam}` : ""} · Group
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.enrolledCount}/{c.maxStudents} enrolled · {c.totalSessions} sessions · ₹{c.priceINR.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.status === "LISTED" ? "bg-green-100 text-green-700" :
                        c.status === "DRAFT" ? "bg-gray-100 text-gray-500" :
                        c.status === "FULL" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-600"
                      }`}>{c.status}</span>
                      {c.status === "DRAFT" && <PublishCourseButton id={c.id} type="group" />}
                      {c.status === "LISTED" && <InviteLinkButton groupCourseId={c.id} />}
                      <MeetingLinkButton courseId={c.id} current={c.sessions[0]?.meetLink ?? null} />
                    </div>
                  </div>
                </div>
              ))}
              {oneOnOnePackages.map((p) => (
                <div key={`p-${p.id}`} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{p.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {p.subject}{p.targetExam ? ` · ${p.targetExam}` : ""} · 1-on-1
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {p.totalSessions} sessions · ₹{p.priceINR.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === "LISTED" ? "bg-emerald-100 text-emerald-700" :
                        p.status === "DRAFT" ? "bg-gray-100 text-gray-500" :
                        "bg-red-100 text-red-600"
                      }`}>{p.status}</span>
                      {p.status === "DRAFT" && <PublishCourseButton id={p.id} type="package" />}
                      {p.status === "LISTED" && <InviteLinkButton oneOnOnePackageId={p.id} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Availability ───────────────────────────────────────────────── */}
        <AvailabilitySection slots={slots} />

        {/* ── Past sessions ──────────────────────────────────────────────── */}
        {past.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">Past sessions</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {past.map((s, i) => (
                <div key={s.id} className={`px-4 py-3 ${i !== past.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {s.groupCourse?.title ?? s.booking?.oneOnOnePackage?.title ?? "Session"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(s.scheduledAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                      s.status === "CANCELLED" ? "bg-gray-100 text-gray-500" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {s.status === "COMPLETED" ? "Done" : s.status === "CANCELLED" ? "Cancelled" : s.status === "NO_SHOW" ? "Missed" : "Ended"}
                    </span>
                  </div>
                  {s.feedback.length > 0 && (
                    <div className="mt-1.5 space-y-1">
                      {s.feedback.map((f, fi) => (
                        <div key={fi} className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="text-amber-400">
                            {"★".repeat(f.rating)}<span className="text-gray-200">{"★".repeat(5 - f.rating)}</span>
                          </span>
                          {f.comment && <span className="italic text-gray-400">&ldquo;{f.comment}&rdquo;</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="h-8" />
      </div>
    </main>
  );
}
