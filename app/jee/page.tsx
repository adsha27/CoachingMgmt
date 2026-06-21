import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://educonnect.in";

export const metadata: Metadata = {
  title: "JEE Coaching Teachers Online | EduConnect",
  description: "Find verified JEE Main and JEE Advanced coaching teachers. Physics, Chemistry, Mathematics. Group courses from ₹299/session. Book online.",
  openGraph: {
    title: "JEE Coaching Teachers Online | EduConnect",
    description: "Verified JEE teachers. Group courses and 1-on-1 sessions. Book from your phone.",
    url: `${BASE}/jee`,
    type: "website",
  },
  twitter: { card: "summary", title: "JEE Coaching Online | EduConnect" },
  alternates: { canonical: `${BASE}/jee` },
};

export default async function JeeLandingPage() {
  const teachers = await prisma.user.findMany({
    where: {
      role: "TEACHER",
      status: "ACTIVE",
      teacherProfile: { verifyStatus: "VERIFIED" },
      OR: [
        { groupCourses: { some: { status: "LISTED", targetExam: { in: ["JEE Main", "JEE Advanced", "JEE"] } } } },
        { oneOnOnePackages: { some: { status: "LISTED", targetExam: { in: ["JEE Main", "JEE Advanced", "JEE"] } } } },
        { teacherProfile: { targetExams: { has: "JEE Main" } } },
        { teacherProfile: { targetExams: { has: "JEE Advanced" } } },
      ],
    },
    select: {
      id: true,
      name: true,
      teacherProfile: {
        select: { subjects: true, targetExams: true, rating: true, profilePhotoUrl: true, bio: true, teachingExperienceYears: true },
      },
      groupCourses: {
        where: { status: "LISTED" },
        select: { id: true, title: true, subject: true, priceINR: true, totalSessions: true },
        take: 2,
      },
      oneOnOnePackages: {
        where: { status: "LISTED" },
        select: { id: true, title: true, subject: true, priceINR: true },
        take: 1,
      },
    },
    take: 20,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "JEE Coaching Teachers",
    description: "Verified JEE Main and JEE Advanced coaching teachers on EduConnect",
    numberOfItems: teachers.length,
    itemListElement: teachers.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE}/teacher/${t.id}`,
      name: t.name,
    })),
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-5 py-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-indigo-600 font-bold text-lg">EduConnect</Link>
          <Link href="/login" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-5 pt-10 pb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          JEE Main · JEE Advanced
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
          JEE Coaching Teachers Online
        </h1>
        <p className="text-base text-gray-500 mb-6 max-w-lg mx-auto">
          Verified Physics, Chemistry, and Maths teachers for JEE Main and Advanced. Group courses from ₹299/session. Book from your phone.
        </p>
        <Link href="/browse?exam=JEE+Advanced"
          className="inline-block px-6 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors">
          Browse all JEE teachers
        </Link>
      </section>

      {/* Teachers */}
      <section className="max-w-3xl mx-auto px-5 pb-12">
        {teachers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">No JEE teachers listed yet.</p>
            <Link href="/browse" className="text-indigo-600 font-semibold hover:underline">Browse all teachers</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {teachers.map((t) => {
              const p = t.teacherProfile;
              const lowest = Math.min(
                ...t.groupCourses.map((c) => c.priceINR),
                ...t.oneOnOnePackages.map((pk) => pk.priceINR),
                Infinity,
              );
              return (
                <Link key={t.id} href={`/teacher/${t.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    {p?.profilePhotoUrl ? (
                      <img src={p.profilePhotoUrl} alt={t.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                        {t.name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                          <p className="text-xs text-indigo-600 mt-0.5">{p?.subjects?.slice(0, 3).join(" · ")}</p>
                        </div>
                        {lowest !== Infinity && (
                          <div className="text-right shrink-0">
                            <div className="text-xs text-gray-400">from</div>
                            <div className="font-bold text-gray-900 text-sm">₹{lowest.toLocaleString("en-IN")}</div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        {p?.rating && p.rating > 0 && (
                          <span className="text-xs text-amber-600 font-medium">★ {p.rating.toFixed(1)}</span>
                        )}
                        {p?.teachingExperienceYears && (
                          <span className="text-xs text-gray-400">{p.teachingExperienceYears}y exp</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/browse"
            className="inline-block px-5 py-2.5 border border-indigo-200 text-indigo-600 text-sm font-semibold rounded-xl hover:bg-indigo-50 transition-colors">
            View all teachers →
          </Link>
        </div>
      </section>

      {/* SEO content */}
      <section className="bg-white border-t border-gray-100 py-10 px-5">
        <div className="max-w-3xl mx-auto prose prose-sm text-gray-600">
          <h2 className="text-lg font-bold text-gray-900 mb-3">How to prepare for JEE online</h2>
          <p>JEE Main and JEE Advanced require strong fundamentals in Physics, Chemistry, and Mathematics. EduConnect connects students with verified teachers who specialize in JEE preparation. You can join affordable group courses to learn alongside peers, or book private 1-on-1 sessions for personalized doubt clearing.</p>
          <p className="mt-3">All teachers on EduConnect are manually verified by our team before appearing on the platform. Sessions happen via Google Meet with automatic reminders sent 1 hour before.</p>
        </div>
      </section>
    </main>
  );
}
