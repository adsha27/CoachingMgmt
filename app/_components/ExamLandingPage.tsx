import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SiteNav from "./SiteNav";

export type ExamConfig = {
  examValues: string[];
  profileExams: string[];
  jsonLdName: string;
  jsonLdDesc: string;
  badge: string;
  h1: string;
  heroDesc: string;
  browseHref: string;
  browseCta: string;
  emptyMsg: string;
  seoH2: string;
  seoPara1: string;
  seoPara2: string;
  theme: "indigo" | "emerald";
};

const THEME = {
  indigo: {
    badge: "bg-orange-50 text-orange-700",
    cta: "bg-orange-600 hover:bg-orange-700 text-white",
    cardHover: "hover:border-orange-200",
    avatar: "from-orange-400 to-orange-600",
    subject: "text-orange-600",
    footerLink: "border-orange-200 text-orange-600 hover:bg-orange-50",
  },
  emerald: {
    badge: "bg-emerald-50 text-emerald-700",
    cta: "bg-emerald-600 hover:bg-emerald-700 text-white",
    cardHover: "hover:border-emerald-200",
    avatar: "from-emerald-400 to-emerald-600",
    subject: "text-emerald-600",
    footerLink: "border-emerald-200 text-emerald-600 hover:bg-emerald-50",
  },
} as const;

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://educonnect.in";

export default async function ExamLandingPage({ config }: { config: ExamConfig }) {
  const t = THEME[config.theme];

  const teachers = await prisma.user.findMany({
    where: {
      role: "TEACHER",
      status: "ACTIVE",
      teacherProfile: { verifyStatus: "VERIFIED" },
      OR: [
        { groupCourses: { some: { status: "LISTED", targetExam: { in: config.examValues } } } },
        { oneOnOnePackages: { some: { status: "LISTED", targetExam: { in: config.examValues } } } },
        ...config.profileExams.map((exam) => ({ teacherProfile: { targetExams: { has: exam } } })),
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
  }).catch(() => []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: config.jsonLdName,
    description: config.jsonLdDesc,
    numberOfItems: teachers.length,
    itemListElement: teachers.map((teacher, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE}/teacher/${teacher.id}`,
      name: teacher.name,
    })),
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SiteNav />

      <section className="max-w-3xl mx-auto px-5 pt-10 pb-8 text-center">
        <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 ${t.badge}`}>
          {config.badge}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">{config.h1}</h1>
        <p className="text-base text-gray-500 mb-6 max-w-lg mx-auto">{config.heroDesc}</p>
        <Link href={config.browseHref}
          className={`inline-block px-6 py-3 font-bold text-sm rounded-xl transition-colors ${t.cta}`}>
          {config.browseCta}
        </Link>
      </section>

      <section className="max-w-3xl mx-auto px-5 pb-12">
        {teachers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">{config.emptyMsg}</p>
            <Link href="/browse" className="text-orange-600 font-semibold hover:underline">Browse all teachers</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {teachers.map((teacher) => {
              const p = teacher.teacherProfile;
              const lowest = Math.min(
                ...teacher.groupCourses.map((c) => c.priceINR),
                ...teacher.oneOnOnePackages.map((pk) => pk.priceINR),
                Infinity,
              );
              return (
                <Link key={teacher.id} href={`/teacher/${teacher.id}`}
                  className={`block bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all ${t.cardHover}`}>
                  <div className="flex items-start gap-3">
                    {p?.profilePhotoUrl ? (
                      <img src={p.profilePhotoUrl} alt={teacher.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold shrink-0 ${t.avatar}`}>
                        {teacher.name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{teacher.name}</p>
                          <p className={`text-xs mt-0.5 ${t.subject}`}>{p?.subjects?.slice(0, 3).join(" · ")}</p>
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
            className={`inline-block px-5 py-2.5 border text-sm font-semibold rounded-xl transition-colors ${t.footerLink}`}>
            View all teachers →
          </Link>
        </div>
      </section>

      <section className="bg-white border-t border-gray-100 py-10 px-5">
        <div className="max-w-3xl mx-auto prose prose-sm text-gray-600">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{config.seoH2}</h2>
          <p>{config.seoPara1}</p>
          <p className="mt-3">{config.seoPara2}</p>
        </div>
      </section>
    </main>
  );
}
