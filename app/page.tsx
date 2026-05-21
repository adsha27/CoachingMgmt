import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <span className="font-bold text-gray-900 text-lg">CoachingMgmt</span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700"
          >
            Register
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
          Run your coaching institute<br />without the paperwork
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
          Schedule sessions, manage teachers and students, send reminders, and track attendance — all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            Get started
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
              See your full schedule, get reminders before every session, and share your availability with the admin.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-6">
            <div className="text-2xl mb-3">🎓</div>
            <h3 className="font-semibold text-gray-900 mb-1">For Students</h3>
            <p className="text-sm text-gray-500">
              See your upcoming sessions, get Google Meet links the moment a session is scheduled, and never miss a class.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-6">
            <div className="text-2xl mb-3">⚙️</div>
            <h3 className="font-semibold text-gray-900 mb-1">For Admins</h3>
            <p className="text-sm text-gray-500">
              Approve registrations, schedule sessions, assign students, and cancel classes — with automatic emails sent to everyone.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
