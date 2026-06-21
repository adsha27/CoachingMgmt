import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://educonnect.in";

export const metadata: Metadata = {
  title: "EduConnect — Find Verified JEE & NEET Teachers",
  description: "Browse verified JEE and NEET coaching teachers. Book affordable group courses or private 1-on-1 sessions from your phone.",
  openGraph: {
    title: "EduConnect — Find Verified JEE & NEET Teachers",
    description: "Verified teachers, group courses from ₹299/session, instant Google Meet links.",
    url: BASE,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EduConnect — JEE & NEET Coaching",
    description: "Verified teachers, affordable group courses, 1-on-1 sessions.",
  },
  alternates: { canonical: BASE },
};

export default async function HomePage() {
  const [teacherCount, courseCount, subjectCount] = await Promise.all([
    prisma.teacherProfile.count({ where: { verifyStatus: "VERIFIED" } }),
    prisma.groupCourse.count({ where: { status: "LISTED" } }),
    prisma.groupCourse.groupBy({ by: ["subject"], where: { status: "LISTED" } }).then((r) => r.length),
  ]);

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex justify-between items-center px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <span className="font-bold text-indigo-600 text-lg tracking-tight">EduConnect</span>
        <div className="flex items-center gap-2">
          <Link href="/browse" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 hidden sm:block">
            Browse
          </Link>
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 hidden sm:block">
            Sign in
          </Link>
          <Link href="/login?next=/student/dashboard"
            className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 font-semibold transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-5 pt-14 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Verified teachers only
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
          Crack JEE &amp; NEET<br />with the right teacher
        </h1>
        <p className="text-base sm:text-lg text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed">
          Browse verified teachers, join affordable group courses, or book private 1-on-1 sessions — from your phone.
        </p>

        {/* CTAs — stacked on mobile, side by side on sm+ */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/browse"
            className="px-6 py-3.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
            Browse teachers
          </Link>
          <Link href="/login"
            className="px-6 py-3.5 bg-white border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors">
            Sign in
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      {(teacherCount > 0 || courseCount > 0) && (
        <section className="bg-indigo-600 text-white py-8 px-5">
          <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold">{teacherCount}+</div>
              <div className="text-xs text-indigo-200 mt-1">Verified teachers</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{courseCount > 0 ? courseCount + "+" : "–"}</div>
              <div className="text-xs text-indigo-200 mt-1">Active courses</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{subjectCount > 0 ? subjectCount : "5"}+</div>
              <div className="text-xs text-indigo-200 mt-1">Subjects covered</div>
            </div>
          </div>
        </section>
      )}

      {/* Feature cards */}
      <section className="max-w-2xl mx-auto px-5 py-14">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-8">Who is EduConnect for?</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: "🎓",
              title: "Students",
              bullets: ["Browse verified JEE/NEET teachers", "Join group courses from ₹299/session", "Book private 1-on-1 sessions", "Get Google Meet links instantly"],
              cta: "Find a teacher",
              href: "/browse",
              color: "indigo",
            },
            {
              icon: "👨‍🏫",
              title: "Teachers",
              bullets: ["List group courses and packages", "Students book and pay online", "Automated scheduling & Meet links", "Get reviews and grow your reach"],
              cta: "Join as teacher",
              href: "/login",
              color: "emerald",
            },
            {
              icon: "👪",
              title: "Parents",
              bullets: ["Track your child's sessions", "View session feedback and ratings", "Read-only access — no extra app", "Stay informed automatically"],
              cta: "Learn more",
              href: "/login",
              color: "purple",
            },
          ].map((card) => (
            <div key={card.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-5 flex flex-col">
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="font-bold text-gray-900 mb-3">{card.title}</h3>
              <ul className="space-y-1.5 flex-1 mb-4">
                {card.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-1.5 text-sm text-gray-600">
                    <svg className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
              <Link href={card.href}
                className={`text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${
                  card.color === "indigo" ? "bg-indigo-600 text-white hover:bg-indigo-700" :
                  card.color === "emerald" ? "bg-emerald-600 text-white hover:bg-emerald-700" :
                  "bg-purple-600 text-white hover:bg-purple-700"
                }`}>
                {card.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Trust signals */}
      <section className="bg-gray-50 border-t border-gray-100 py-10 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Why students trust EduConnect</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: "✅", label: "Admin-verified", sub: "Every teacher reviewed" },
              { icon: "📱", label: "Mobile-first", sub: "Works on any phone" },
              { icon: "🔗", label: "Auto Meet links", sub: "One tap to join" },
              { icon: "⭐", label: "Real reviews", sub: "From verified students" },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl p-3 border border-gray-100">
                <div className="text-xl mb-1">{item.icon}</div>
                <p className="text-xs font-bold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-14 px-5 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to start preparing?</h2>
        <p className="text-sm text-gray-500 mb-6">Join thousands of students cracking JEE and NEET with verified teachers.</p>
        <Link href="/browse"
          className="inline-block px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
          Browse teachers now
        </Link>
      </section>

      <footer className="border-t border-gray-100 py-6 px-5 text-center">
        <p className="text-xs text-gray-400">© 2025 EduConnect · Helping students crack JEE &amp; NEET</p>
      </footer>
    </main>
  );
}
