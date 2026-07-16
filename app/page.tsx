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
    prisma.teacherProfile.count({ where: { verifyStatus: "VERIFIED" } }).catch(() => 0),
    prisma.groupCourse.count({ where: { status: "LISTED" } }).catch(() => 0),
    prisma.groupCourse.groupBy({ by: ["subject"], where: { status: "LISTED" } }).then((r) => r.length).catch(() => 0),
  ]);

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex justify-between items-center px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <span className="font-bold text-slate-900 text-lg tracking-tight">EduConnect</span>
        <div className="flex items-center gap-2">
          <Link href="/browse" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 hidden sm:block">
            Browse
          </Link>
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 hidden sm:block">
            Sign in
          </Link>
          <Link href="/login?next=/student/dashboard"
            className="text-sm bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-700 font-semibold transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-5 pt-14 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
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
            className="px-6 py-3.5 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-md shadow-orange-200">
            Browse teachers
          </Link>
          <Link href="/login"
            className="px-6 py-3.5 bg-white border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors">
            Sign in
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-slate-900 text-white py-8 px-5">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold">{teacherCount > 0 ? `${teacherCount}+` : "—"}</div>
            <div className="text-xs text-slate-400 mt-1">Verified teachers</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{courseCount > 0 ? `${courseCount}+` : "—"}</div>
            <div className="text-xs text-slate-400 mt-1">Active courses</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{subjectCount > 0 ? `${subjectCount}+` : "—"}</div>
            <div className="text-xs text-slate-400 mt-1">Subjects covered</div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-2xl mx-auto px-5 py-14">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-8">Who is EduConnect for?</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            {
              title: "Students",
              bullets: ["Browse verified JEE/NEET teachers", "Join group courses from ₹299/session", "Book private 1-on-1 sessions", "Get Google Meet links instantly"],
              cta: "Find a teacher",
              href: "/browse",
            },
            {
              title: "Parents",
              bullets: ["Track your child's sessions", "View session feedback and ratings", "Read-only access — no extra app", "Stay informed automatically"],
              cta: "Learn more",
              href: "/login",
            },
          ].map((card) => (
            <div key={card.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-5 flex flex-col">
              <h3 className="font-bold text-gray-900 mb-3">{card.title}</h3>
              <ul className="space-y-1.5 flex-1 mb-4">
                {card.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-1.5 text-sm text-gray-600">
                    <svg className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
              <Link href={card.href}
                className="text-center text-sm font-semibold py-2.5 rounded-xl transition-colors bg-orange-600 text-white hover:bg-orange-700">
                {card.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Trust signals */}
      <section className="border-t border-gray-100 py-8 px-5">
        <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-3">
          {[
            "Admin-verified teachers",
            "Auto Google Meet links",
            "Real student reviews",
            "Works on any phone",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-14 px-5 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to start preparing?</h2>
        <p className="text-sm text-gray-500 mb-6">Join thousands of students cracking JEE and NEET with verified teachers.</p>
        <Link href="/browse"
          className="inline-block px-8 py-3.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-md shadow-orange-200">
          Browse teachers now
        </Link>
      </section>

      <footer className="border-t border-gray-100 py-6 px-5 text-center space-y-2">
        <p className="text-xs text-gray-400">© 2025 EduConnect · Helping students crack JEE &amp; NEET</p>
        <p className="text-xs text-gray-400">
          Are you a teacher?{" "}
          <Link href="/login?portal=teacher&next=/teacher/dashboard" className="text-gray-500 underline hover:text-gray-700">
            Teacher login
          </Link>
        </p>
      </footer>
    </main>
  );
}
