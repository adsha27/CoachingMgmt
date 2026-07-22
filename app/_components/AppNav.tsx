import Link from "next/link";

type Role = "TEACHER" | "STUDENT" | "ADMIN" | string;

// One nav bar for every signed-in page, so you can reach anything from
// anywhere instead of walking back to a dashboard first.
const LINKS: Record<string, { href: string; label: string }[]> = {
  TEACHER: [
    { href: "/teacher/dashboard", label: "Dashboard" },
    { href: "/teacher/courses/new", label: "New course" },
    { href: "/teacher/wizard", label: "My profile" },
    { href: "/browse", label: "Browse" },
  ],
  STUDENT: [
    { href: "/student/dashboard", label: "Dashboard" },
    { href: "/browse", label: "Find a teacher" },
  ],
  ADMIN: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/teachers", label: "Teachers" },
    { href: "/admin/students", label: "Students" },
    { href: "/admin/courses", label: "Courses" },
  ],
};

export default function AppNav({ role, current }: { role: Role; current?: string }) {
  const links = LINKS[role] ?? [];
  const home = role === "TEACHER" ? "/teacher/dashboard" : role === "STUDENT" ? "/student/dashboard" : "/admin";

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5">
      <div className="max-w-5xl mx-auto flex items-center gap-1 overflow-x-auto">
        <Link href={home} className="font-bold text-sm text-gray-900 shrink-0 mr-3">
          Novus <span className="text-orange-600">Classes</span>
        </Link>
        {links.map((l) => {
          const active = current === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                active
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
