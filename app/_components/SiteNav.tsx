import Link from "next/link";

export default function SiteNav() {
  return (
    <nav className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-indigo-600 font-bold text-lg tracking-tight">EduConnect</Link>
        <Link href="/login" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
          Get started
        </Link>
      </div>
    </nav>
  );
}
