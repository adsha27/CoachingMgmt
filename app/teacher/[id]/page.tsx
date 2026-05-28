import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

function youtubeEmbedId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
  } catch {}
  return null;
}

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teacherId = Number(id);
  if (isNaN(teacherId)) notFound();

  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      role: "TEACHER",
      status: "ACTIVE",
      teacherProfile: { verifyStatus: "VERIFIED" },
    },
    select: {
      id: true,
      name: true,
      teacherProfile: {
        select: {
          bio: true,
          qualifications: true,
          subjects: true,
          targetExams: true,
          teachingExperienceYears: true,
          rating: true,
          profilePhotoUrl: true,
          demoVideoLink: true,
          socialMediaLinks: true,
        },
      },
      groupCourses: {
        where: { status: "LISTED" },
        select: {
          id: true,
          title: true,
          description: true,
          subject: true,
          targetExam: true,
          priceINR: true,
          startDate: true,
          totalSessions: true,
          sessionDurationMinutes: true,
          enrolledCount: true,
          maxStudents: true,
        },
        orderBy: { startDate: "asc" },
      },
      oneOnOnePackages: {
        where: { status: "LISTED" },
        select: {
          id: true,
          title: true,
          description: true,
          subject: true,
          targetExam: true,
          priceINR: true,
          totalSessions: true,
          sessionDurationMinutes: true,
        },
      },
    },
  });

  if (!teacher) notFound();

  const p = teacher.teacherProfile;
  const social = (p?.socialMediaLinks ?? {}) as Record<string, string>;
  const embedId = p?.demoVideoLink ? youtubeEmbedId(p.demoVideoLink) : null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link href="/browse" className="text-sm text-indigo-600 hover:underline mb-6 inline-block">
          ← Browse teachers
        </Link>

        {/* Profile header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-5">
            {p?.profilePhotoUrl ? (
              <img
                src={p.profilePhotoUrl}
                alt={teacher.name}
                className="w-20 h-20 rounded-full object-cover bg-gray-100 shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl shrink-0">
                {teacher.name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{teacher.name}</h1>
              {(p?.subjects?.length ?? 0) > 0 && (
                <p className="text-gray-500 mt-1">{p!.subjects.join(" · ")}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                {p?.rating && (
                  <span className="font-medium text-amber-600">★ {p.rating.toFixed(1)}</span>
                )}
                {p?.teachingExperienceYears && (
                  <span>{p.teachingExperienceYears} years experience</span>
                )}
                {(p?.targetExams?.length ?? 0) > 0 && (
                  <span>{p!.targetExams.join(", ")}</span>
                )}
              </div>
              {/* Social links */}
              {Object.keys(social).length > 0 && (
                <div className="flex gap-3 mt-3">
                  {social.youtube && (
                    <a href={social.youtube} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-red-500">YouTube</a>
                  )}
                  {social.instagram && (
                    <a href={social.instagram} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-pink-500">Instagram</a>
                  )}
                  {social.twitter && (
                    <a href={social.twitter} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-blue-400">Twitter</a>
                  )}
                  {social.linkedin && (
                    <a href={social.linkedin} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-blue-600">LinkedIn</a>
                  )}
                </div>
              )}
            </div>
          </div>

          {p?.bio && (
            <p className="mt-5 text-gray-700 text-sm leading-relaxed">{p.bio}</p>
          )}

          {p?.qualifications && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Qualifications
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{p.qualifications}</p>
            </div>
          )}
        </div>

        {/* Demo video */}
        {embedId && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Introduction video</h2>
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${embedId}`}
                title="Demo video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Group courses */}
        {teacher.groupCourses.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">Group Courses</h2>
            <div className="space-y-3">
              {teacher.groupCourses.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{c.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {c.subject}{c.targetExam ? ` · ${c.targetExam}` : ""}
                        {" · "}{c.totalSessions} sessions × {c.sessionDurationMinutes} min
                        {" · "}Starts {new Date(c.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      {c.description && (
                        <p className="text-sm text-gray-600 mt-2">{c.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {c.enrolledCount} / {c.maxStudents} seats filled
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-gray-900">
                        ₹{c.priceINR.toLocaleString("en-IN")}
                      </div>
                      <Link
                        href={`/login?next=/courses/${c.id}/book`}
                        className="mt-2 inline-block text-sm px-4 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Enrol
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1-on-1 packages */}
        {teacher.oneOnOnePackages.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">1-on-1 Packages</h2>
            <div className="space-y-3">
              {teacher.oneOnOnePackages.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{p.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {p.subject}{p.targetExam ? ` · ${p.targetExam}` : ""}
                        {" · "}{p.totalSessions} sessions × {p.sessionDurationMinutes} min
                      </p>
                      {p.description && (
                        <p className="text-sm text-gray-600 mt-2">{p.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-gray-900">
                        ₹{p.priceINR.toLocaleString("en-IN")}
                      </div>
                      <Link
                        href={`/login?next=/packages/${p.id}/book`}
                        className="mt-2 inline-block text-sm px-4 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
