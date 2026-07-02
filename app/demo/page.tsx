import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DemoPage() {
  if (process.env.DEMO_MODE !== "true") redirect("/");

  const personas = [
    {
      role: "Student",
      email: "arjun.mehta@educonnect.in",
      name: "Arjun Mehta",
      desc: "Browse teachers, view upcoming sessions, check past sessions with ratings, request topics, manage parent access.",
      href: "/api/dev/login?email=arjun.mehta@educonnect.in",
      accent: "orange",
    },
    {
      role: "Teacher",
      email: "ravi.kumar@educonnect.in",
      name: "Ravi Kumar",
      desc: "View upcoming sessions, manage slot proposals, create courses and packages, set availability, see ratings.",
      href: "/api/dev/login?email=ravi.kumar@educonnect.in",
      accent: "emerald",
    },
    {
      role: "Admin",
      email: "demo-admin@educonnect.in",
      name: "Platform Admin",
      desc: "Verify or reject teacher profiles, manage cancellations, review topic requests, suspend accounts.",
      href: "/api/dev/login?email=demo-admin@educonnect.in",
      accent: "slate",
    },
  ] as const;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-5 py-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-slate-900 font-bold text-lg tracking-tight">EduConnect</Link>
          <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">Demo mode</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-14 flex-1">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Choose a demo persona</h1>
          <p className="text-gray-500">Click to log in instantly — no OTP, no password. Pre-seeded with realistic data.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {personas.map((p) => (
            <a key={p.role} href={p.href}
              className="block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all group">
              <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mb-4 ${
                p.accent === "orange" ? "bg-orange-50 text-orange-700" :
                p.accent === "emerald" ? "bg-emerald-50 text-emerald-700" :
                "bg-slate-100 text-slate-700"
              }`}>
                {p.role}
              </div>
              <h2 className="font-bold text-gray-900 text-lg mb-1">{p.name}</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">{p.desc}</p>
              <div className={`text-sm font-semibold px-4 py-2.5 rounded-xl text-center transition-colors ${
                p.accent === "orange" ? "bg-orange-600 text-white group-hover:bg-orange-700" :
                p.accent === "emerald" ? "bg-emerald-600 text-white group-hover:bg-emerald-700" :
                "bg-slate-800 text-white group-hover:bg-slate-900"
              }`}>
                Login as {p.role} →
              </div>
            </a>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">What each persona can demo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-gray-600">
            <div>
              <p className="font-semibold text-gray-900 mb-2">Student flow</p>
              <ul className="space-y-1.5">
                {["Browse teacher marketplace", "View teacher profile", "See enrolled courses", "View today's session (with Meet link)", "Past sessions + give rating", "Request a topic", "Manage parent access"].map(i => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-orange-500 mt-0.5">✓</span> {i}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">Teacher flow</p>
              <ul className="space-y-1.5">
                {["Dashboard with upcoming sessions", "Slot proposals to confirm", "Listed group courses", "Listed 1-on-1 packages", "Set weekly availability", "View past sessions with ratings", "Public profile page", "Invite link generator"].map(i => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5">✓</span> {i}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">Admin flow</p>
              <ul className="space-y-1.5">
                {["Teacher verification queue", "Approve / reject profiles", "Cancellation requests", "Topic request signals", "Suspend / reactivate accounts"].map(i => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-slate-500 mt-0.5">✓</span> {i}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-100 py-5 px-5 text-center">
        <p className="text-xs text-gray-400">Demo environment · Data resets on re-seed</p>
      </footer>
    </main>
  );
}
