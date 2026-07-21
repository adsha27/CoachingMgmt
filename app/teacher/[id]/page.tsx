import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { discountPct } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://novusclasses.in";

export async function generateStaticParams() {
  try {
    const profiles = await prisma.teacherProfile.findMany({
      where: { verifyStatus: "VERIFIED" },
      select: { teacherId: true },
    });
    return profiles.map((p) => ({ id: String(p.teacherId) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const teacherId = Number(id);
  if (isNaN(teacherId)) return {};

  const teacher = await prisma.user.findFirst({
    where: { id: teacherId, role: "TEACHER", status: "ACTIVE", teacherProfile: { verifyStatus: "VERIFIED" } },
    select: {
      name: true,
      teacherProfile: {
        select: { bio: true, subjects: true, targetExams: true, profilePhotoUrl: true, rating: true },
      },
    },
  });
  if (!teacher) return {};

  const p = teacher.teacherProfile;
  const subjects = p?.subjects?.join(", ") ?? "";
  const exams = p?.targetExams?.join(", ") ?? "";
  const title = `${teacher.name} — ${subjects} Teacher${exams ? ` for ${exams}` : ""} | Novus Classes`;
  const description =
    p?.bio?.slice(0, 155) ??
    `Book ${teacher.name} for ${subjects} coaching on Novus Classes. Verified JEE & NEET teacher.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE}/teacher/${teacherId}`,
      type: "profile",
      images: p?.profilePhotoUrl ? [{ url: p.profilePhotoUrl, alt: teacher.name }] : [],
    },
    twitter: { card: "summary", title, description },
    alternates: { canonical: `${BASE}/teacher/${teacherId}` },
  };
}

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

  // The owner (previewing their own page) and admins can view before the
  // profile is verified; everyone else only sees verified, active teachers.
  const viewer = await getCurrentUser();
  const isPrivileged = !!viewer && (viewer.id === teacherId || viewer.role === "ADMIN");

  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      role: "TEACHER",
      ...(isPrivileged ? {} : { status: "ACTIVE", teacherProfile: { verifyStatus: "VERIFIED" } }),
    },
    select: {
      id: true,
      name: true,
      teacherProfile: {
        select: {
          verifyStatus: true,
          bio: true,
          qualifications: true,
          subjects: true,
          targetExams: true,
          expertiseTags: true,
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
          originalPriceINR: true,
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
          originalPriceINR: true,
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${BASE}/teacher/${teacher.id}`,
        name: teacher.name,
        jobTitle: `${p?.subjects?.join(", ") ?? ""}${p?.targetExams?.length ? ` Teacher (${p.targetExams.join(", ")})` : " Teacher"}`,
        description: p?.bio ?? undefined,
        image: p?.profilePhotoUrl ?? undefined,
        url: `${BASE}/teacher/${teacher.id}`,
        ...(p?.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, bestRating: 5 } } : {}),
      },
      ...teacher.groupCourses.map((c) => ({
        "@type": "Course",
        name: c.title,
        description: c.description ?? undefined,
        provider: { "@type": "Person", name: teacher.name },
        url: `${BASE}/courses/${c.id}/book`,
        offers: {
          "@type": "Offer",
          price: c.priceINR,
          priceCurrency: "INR",
          availability: c.enrolledCount < c.maxStudents
            ? "https://schema.org/InStock"
            : "https://schema.org/SoldOut",
        },
      })),
    ],
  };

  return (
    <main className="min-h-screen bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Owner/admin preview notice — this page isn't public until verified */}
        {isPrivileged && p?.verifyStatus !== "VERIFIED" && (
          <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
            <span className="text-lg shrink-0">👁️</span>
            <div className="text-sm text-amber-800">
              <p className="font-semibold">Preview — not visible to students yet</p>
              <p className="text-amber-700 mt-0.5">
                This is how your page will look once the Novus Classes team verifies your profile.
                {viewer?.id === teacherId && (
                  <> <Link href="/teacher/wizard" className="underline font-medium">Edit profile</Link></>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Back link */}
        <Link
          href={viewer?.id === teacherId ? "/teacher/dashboard" : "/browse"}
          className="text-sm font-semibold text-accent hover:text-accent-dark mb-6 inline-block"
        >
          {viewer?.id === teacherId ? "← Dashboard" : "← Browse teachers"}
        </Link>

        {/* Profile header */}
        <div className="bg-surface rounded-2xl border border-line p-6 mb-6">
          <div className="flex items-start gap-5">
            {p?.profilePhotoUrl ? (
              <img
                src={p.profilePhotoUrl}
                alt={teacher.name}
                className="w-20 h-20 rounded-full object-cover bg-surface-sunken shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-accent-tint flex items-center justify-center text-accent font-extrabold text-2xl shrink-0">
                {teacher.name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-ink">{teacher.name}</h1>
              {(p?.subjects?.length ?? 0) > 0 && (
                <p className="text-ink-soft mt-1">{p!.subjects.join(" · ")}</p>
              )}
              <div className="flex items-center gap-4 mt-2 font-mono text-sm text-ink-soft">
                {p?.rating && (
                  <span className="font-medium text-ink">{p.rating.toFixed(1)} ★</span>
                )}
                {p?.teachingExperienceYears && (
                  <span>{p.teachingExperienceYears} years experience</span>
                )}
                {(p?.targetExams?.length ?? 0) > 0 && (
                  <span>{p!.targetExams.join(", ")}</span>
                )}
              </div>
              {(p?.expertiseTags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {p!.expertiseTags.map((tag) => (
                    <span key={tag}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-sunken border border-line text-ink-soft">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {/* Social links */}
              {Object.keys(social).length > 0 && (
                <div className="flex gap-3 mt-3">
                  {social.youtube && (
                    <a href={social.youtube} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-ink-soft hover:text-danger">YouTube</a>
                  )}
                  {social.instagram && (
                    <a href={social.instagram} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-ink-soft hover:text-accent">Instagram</a>
                  )}
                  {social.twitter && (
                    <a href={social.twitter} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-ink-soft hover:text-accent">Twitter</a>
                  )}
                  {social.linkedin && (
                    <a href={social.linkedin} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-ink-soft hover:text-accent">LinkedIn</a>
                  )}
                </div>
              )}
            </div>
          </div>

          {p?.bio && (
            <p className="mt-5 text-ink text-sm leading-relaxed">{p.bio}</p>
          )}

          {p?.qualifications && (
            <div className="mt-4 border-t border-line pt-4">
              <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1">
                Qualifications
              </h3>
              <p className="text-sm text-ink whitespace-pre-line">{p.qualifications}</p>
            </div>
          )}
        </div>

        {/* Demo video */}
        {embedId && (
          <div className="bg-surface rounded-2xl border border-line p-6 mb-6">
            <h2 className="font-semibold text-ink mb-4">Introduction video</h2>
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
            <h2 className="font-semibold text-ink mb-3">Group Courses</h2>
            <div className="space-y-3">
              {teacher.groupCourses.map((c) => (
                <div key={c.id} className="bg-surface rounded-2xl border border-line p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-ink">{c.title}</h3>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {c.subject}{c.targetExam ? ` · ${c.targetExam}` : ""}
                        {" · "}{c.totalSessions} sessions × {c.sessionDurationMinutes} min
                        {" · "}Starts {new Date(c.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      {c.description && (
                        <p className="text-sm text-ink mt-2">{c.description}</p>
                      )}
                      <p className="text-xs text-ink-soft mt-1">
                        {c.enrolledCount} / {c.maxStudents} seats filled
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {(() => {
                        const off = discountPct(c.originalPriceINR, c.priceINR);
                        return off !== null ? (
                          <div className="text-xs font-mono">
                            <span className="text-ink-soft line-through">₹{c.originalPriceINR!.toLocaleString("en-IN")}</span>{" "}
                            <span className="font-semibold text-accent">{off}% off</span>
                          </div>
                        ) : null;
                      })()}
                      <div className="text-lg font-bold text-ink font-mono">
                        ₹{c.priceINR.toLocaleString("en-IN")}
                      </div>
                      <Link
                        href={`/courses/${c.id}/book`}
                        className="mt-2 inline-block text-sm px-5 py-2.5 bg-accent text-white rounded-lg font-semibold hover:bg-accent-dark transition-colors"
                      >
                        Apply
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
            <h2 className="font-semibold text-ink mb-3">1-on-1 Packages</h2>
            <div className="space-y-3">
              {teacher.oneOnOnePackages.map((p) => (
                <div key={p.id} className="bg-surface rounded-2xl border border-line p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-ink">{p.title}</h3>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {p.subject}{p.targetExam ? ` · ${p.targetExam}` : ""}
                        {" · "}{p.totalSessions} sessions × {p.sessionDurationMinutes} min
                      </p>
                      {p.description && (
                        <p className="text-sm text-ink mt-2">{p.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {(() => {
                        const off = discountPct(p.originalPriceINR, p.priceINR);
                        return off !== null ? (
                          <div className="text-xs font-mono">
                            <span className="text-ink-soft line-through">₹{p.originalPriceINR!.toLocaleString("en-IN")}</span>{" "}
                            <span className="font-semibold text-accent">{off}% off</span>
                          </div>
                        ) : null;
                      })()}
                      <div className="text-lg font-bold text-ink font-mono">
                        ₹{p.priceINR.toLocaleString("en-IN")}
                      </div>
                      <Link
                        href={`/packages/${p.id}/book`}
                        className="mt-2 inline-block text-sm px-5 py-2.5 bg-ink text-paper rounded-lg font-semibold hover:opacity-90 transition-opacity"
                      >
                        Apply
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
