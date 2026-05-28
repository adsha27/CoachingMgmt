import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <span className="font-bold text-gray-900 text-lg">CoachingMgmt</span>
        <div className="flex gap-3">
          <Link href="/browse" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">
            Browse
          </Link>
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">
            Sign in
          </Link>
          <Link
            href="/login"
            className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700"
          >
            Register
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
          Find the right teacher<br />for JEE &amp; NEET
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
          Browse verified teachers, enrol in group courses or book 1-on-1 packages — all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/browse"
            className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            Browse Teachers
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-6">
            <div className="text-2xl mb-3">👨‍🏫</div>
            <h3 className="font-semibold text-gray-900 mb-1">For Teachers</h3>
            <p className="text-sm text-gray-500">
              Create group courses or 1-on-1 packages, set availability, get bookings, and teach — we handle the scheduling.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-6">
            <div className="text-2xl mb-3">🎓</div>
            <h3 className="font-semibold text-gray-900 mb-1">For Students</h3>
            <p className="text-sm text-gray-500">
              Browse teachers, enrol in courses, propose session slots, and get Google Meet links automatically.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-6">
            <div className="text-2xl mb-3">👪</div>
            <h3 className="font-semibold text-gray-900 mb-1">For Parents</h3>
            <p className="text-sm text-gray-500">
              Track your child&apos;s sessions, view feedback, and stay in the loop — with read-only access linked to their account.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
