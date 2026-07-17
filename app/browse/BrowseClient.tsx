"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";

type GroupCourse = {
  id: number;
  title: string;
  subject: string;
  targetExam: string | null;
  priceINR: number;
  startDate: string;
  sessionDurationMinutes: number;
  totalSessions: number;
  enrolledCount: number;
  maxStudents: number;
};

type OneOnOnePackage = {
  id: number;
  title: string;
  subject: string;
  targetExam: string | null;
  priceINR: number;
  sessionDurationMinutes: number;
  totalSessions: number;
};

type Teacher = {
  id: number;
  name: string;
  teacherProfile: {
    bio: string | null;
    qualifications: string | null;
    subjects: string[];
    targetExams: string[];
    expertiseTags: string[];
    teachingExperienceYears: number | null;
    rating: number | null;
    profilePhotoUrl: string | null;
  } | null;
  groupCourses: GroupCourse[];
  oneOnOnePackages: OneOnOnePackage[];
};

type Sort = "default" | "price_asc" | "price_desc" | "date_asc";

function allSubjects(teachers: Teacher[]) {
  const set = new Set<string>();
  for (const t of teachers) {
    for (const c of t.groupCourses) set.add(c.subject);
    for (const p of t.oneOnOnePackages) set.add(p.subject);
  }
  return [...set].sort();
}

function allExams(teachers: Teacher[]) {
  const set = new Set<string>();
  for (const t of teachers) {
    for (const c of t.groupCourses) if (c.targetExam) set.add(c.targetExam);
    for (const p of t.oneOnOnePackages) if (p.targetExam) set.add(p.targetExam);
  }
  return [...set].sort();
}

function minPrice(t: Teacher): number {
  const prices = [
    ...t.groupCourses.map((c) => c.priceINR),
    ...t.oneOnOnePackages.map((p) => p.priceINR),
  ];
  return prices.length ? Math.min(...prices) : Infinity;
}

function earliestStart(t: Teacher): string {
  const dates = t.groupCourses.map((c) => c.startDate).sort();
  return dates[0] ?? "9999";
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
        active
          ? "bg-accent text-white shadow-sm"
          : "bg-surface border border-line text-ink-soft hover:border-accent hover:text-accent"
      }`}
    >
      {label}
    </button>
  );
}

function TeacherCard({ teacher }: { teacher: Teacher }) {
  const p = teacher.teacherProfile;
  const lowest = minPrice(teacher);

  return (
    <Link
      href={`/teacher/${teacher.id}`}
      className="block bg-surface rounded-2xl border border-line border-t-[3px] border-t-accent p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {p?.profilePhotoUrl ? (
          <img src={p.profilePhotoUrl} alt={teacher.name}
            className="w-14 h-14 rounded-2xl object-cover bg-surface-sunken shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-accent-tint flex items-center justify-center text-accent font-extrabold text-xl shrink-0">
            {teacher.name[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-bold text-ink text-base">{teacher.name}</h2>
              {(p?.subjects?.length ?? 0) > 0 && (
                <p className="text-xs text-ink-soft font-medium mt-0.5">
                  {p!.subjects.slice(0, 3).join(" · ")}
                </p>
              )}
            </div>
            {lowest !== Infinity && (
              <div className="text-right shrink-0">
                <div className="text-xs text-ink-soft">from</div>
                <div className="text-base font-bold text-ink font-mono">₹{lowest.toLocaleString("en-IN")}</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap font-mono text-xs text-ink-soft">
            {p?.rating && p.rating > 0 && <span>{p.rating.toFixed(1)} ★</span>}
            {p?.teachingExperienceYears && (
              <span>{p.teachingExperienceYears}y exp</span>
            )}
            {(p?.targetExams?.length ?? 0) > 0 && (
              <span>{p!.targetExams.slice(0, 2).join(", ")}</span>
            )}
          </div>
        </div>
      </div>

      {(p?.expertiseTags?.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p!.expertiseTags.slice(0, 3).map((tag) => (
            <span key={tag}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-sunken border border-line text-ink-soft">
              {tag}
            </span>
          ))}
        </div>
      )}

      {p?.bio && (
        <p className="mt-3 text-sm text-ink-soft line-clamp-2 leading-relaxed">{p.bio}</p>
      )}

      {(teacher.groupCourses.length > 0 || teacher.oneOnOnePackages.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {teacher.groupCourses.slice(0, 2).map((c) => (
            <span key={c.id}
              className="inline-flex items-center gap-1 rounded-lg bg-accent-tint px-2.5 py-1 text-xs font-medium text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              {c.title}
              <span className="font-mono font-normal ml-0.5">· ₹{c.priceINR.toLocaleString("en-IN")}</span>
            </span>
          ))}
          {teacher.oneOnOnePackages.slice(0, 1).map((pkg) => (
            <span key={pkg.id}
              className="inline-flex items-center gap-1 rounded-lg bg-surface-sunken border border-line px-2.5 py-1 text-xs font-medium text-ink-soft">
              <span className="w-1.5 h-1.5 rounded-full bg-ink-soft shrink-0" />
              1-on-1 · {pkg.subject}
              <span className="font-mono font-normal ml-0.5">· ₹{pkg.priceINR.toLocaleString("en-IN")}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <span className="text-xs font-semibold text-accent">View profile →</span>
      </div>
    </Link>
  );
}

export default function BrowseClient({ teachers }: { teachers: Teacher[] }) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [exam, setExam] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "GROUP" | "ONE_ON_ONE">("");
  const [sort, setSort] = useState<Sort>("default");
  const chipRef = useRef<HTMLDivElement>(null);

  const subjects = useMemo(() => allSubjects(teachers), [teachers]);
  const exams = useMemo(() => allExams(teachers), [teachers]);
  const hasFilters = !!(query || subject || exam || typeFilter);

  const filtered = useMemo(() => {
    let list = teachers.map((t) => {
      const gc = t.groupCourses.filter(
        (c) => (!subject || c.subject === subject) && (!exam || c.targetExam === exam) && (!typeFilter || typeFilter === "GROUP")
      );
      const p11 = t.oneOnOnePackages.filter(
        (pkg) => (!subject || pkg.subject === subject) && (!exam || pkg.targetExam === exam) && (!typeFilter || typeFilter === "ONE_ON_ONE")
      );
      return { ...t, groupCourses: gc, oneOnOnePackages: p11 };
    }).filter(
      (t) =>
        (t.groupCourses.length > 0 || t.oneOnOnePackages.length > 0) &&
        (!query || t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.teacherProfile?.subjects?.some((s) => s.toLowerCase().includes(query.toLowerCase())))
    );

    if (sort === "price_asc") list.sort((a, b) => minPrice(a) - minPrice(b));
    if (sort === "price_desc") list.sort((a, b) => minPrice(b) - minPrice(a));
    if (sort === "date_asc") list.sort((a, b) => earliestStart(a).localeCompare(earliestStart(b)));
    return list;
  }, [teachers, query, subject, exam, typeFilter, sort]);

  function clearAll() { setQuery(""); setSubject(""); setExam(""); setTypeFilter(""); }

  return (
    <div className="min-h-screen bg-paper">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-line shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-3">
          {/* Search bar */}
          <div className="flex items-center gap-3">
            <a href="/" className="hidden sm:flex items-center gap-2 shrink-0 font-extrabold tracking-tight text-ink">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-[7px] bg-accent text-sm font-extrabold text-white">N</span>
              <span className="hidden md:inline">Novus <span className="text-accent">Classes</span></span>
            </a>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teachers or subjects…"
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-surface-sunken border border-line rounded-lg text-ink placeholder:text-ink-soft focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink text-xs">✕</button>
              )}
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}
              className="hidden sm:block shrink-0 text-sm border border-line rounded-lg px-3 py-2.5 bg-surface text-ink-soft focus:outline-none focus:border-accent">
              <option value="default">Relevant</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
              <option value="date_asc">Starts soon</option>
            </select>
          </div>

          {/* Filter chips — horizontal scroll (no scrollbar shown) */}
          <div ref={chipRef} className="flex gap-2 overflow-x-auto pb-0.5"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <Chip label="All" active={!subject && !exam && !typeFilter && !query} onClick={clearAll} />
            {subjects.map((s) => (
              <Chip key={s} label={s} active={subject === s} onClick={() => setSubject(subject === s ? "" : s)} />
            ))}
            <span className="w-px bg-line shrink-0 self-stretch" />
            {exams.map((e) => (
              <Chip key={e} label={e} active={exam === e} onClick={() => setExam(exam === e ? "" : e)} />
            ))}
            <span className="w-px bg-line shrink-0 self-stretch" />
            <Chip label="Group course" active={typeFilter === "GROUP"} onClick={() => setTypeFilter(typeFilter === "GROUP" ? "" : "GROUP")} />
            <Chip label="1-on-1" active={typeFilter === "ONE_ON_ONE"} onClick={() => setTypeFilter(typeFilter === "ONE_ON_ONE" ? "" : "ONE_ON_ONE")} />
          </div>

          {/* Mobile: sort + count */}
          <div className="flex items-center justify-between sm:hidden">
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}
              className="text-sm border border-line rounded-lg px-3 py-1.5 bg-surface text-ink-soft focus:outline-none">
              <option value="default">Relevant</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
              <option value="date_asc">Starts soon</option>
            </select>
            <span className="text-sm text-ink-soft">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-4xl mx-auto px-4 py-5">
        <p className="hidden sm:block text-sm text-ink-soft mb-4">
          {filtered.length} teacher{filtered.length !== 1 ? "s" : ""}
          {hasFilters && <> · <button onClick={clearAll} className="text-accent hover:underline">clear filters</button></>}
        </p>

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-ink mb-2">No teachers found</h3>
            <p className="text-sm text-ink-soft mb-6">
              {hasFilters ? "Try removing a filter or searching by name." : "No teachers available right now."}
            </p>
            {hasFilters && (
              <button onClick={clearAll}
                className="px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-dark transition-colors">
                Clear all filters
              </button>
            )}
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </div>

        {filtered.length > 0 && (
          <p className="text-center text-xs text-ink-soft mt-10 pb-6">
            All teachers are verified by our team before appearing here.
          </p>
        )}
      </div>
    </div>
  );
}
