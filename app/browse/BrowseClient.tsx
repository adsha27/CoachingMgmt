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
          ? "bg-orange-600 text-white shadow-sm"
          : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
      }`}
    >
      {label}
    </button>
  );
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill="currentColor"
          className={`w-3.5 h-3.5 ${i < full ? "text-amber-400" : "text-gray-200"}`}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-xs text-gray-500 font-medium">{rating.toFixed(1)}</span>
    </span>
  );
}

function TeacherCard({ teacher }: { teacher: Teacher }) {
  const p = teacher.teacherProfile;
  const lowest = minPrice(teacher);

  return (
    <Link
      href={`/teacher/${teacher.id}`}
      className="block bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 hover:border-orange-200 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {p?.profilePhotoUrl ? (
          <img src={p.profilePhotoUrl} alt={teacher.name}
            className="w-14 h-14 rounded-2xl object-cover bg-gray-100 shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
            {teacher.name[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-bold text-gray-900 text-base">{teacher.name}</h2>
              {(p?.subjects?.length ?? 0) > 0 && (
                <p className="text-xs text-orange-600 font-medium mt-0.5">
                  {p!.subjects.slice(0, 3).join(" · ")}
                </p>
              )}
            </div>
            {lowest !== Infinity && (
              <div className="text-right shrink-0">
                <div className="text-xs text-gray-400">from</div>
                <div className="text-base font-bold text-gray-900">₹{lowest.toLocaleString("en-IN")}</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {p?.rating && p.rating > 0 && <Stars rating={p.rating} />}
            {p?.teachingExperienceYears && (
              <span className="text-xs text-gray-400">{p.teachingExperienceYears}y exp</span>
            )}
            {(p?.targetExams?.length ?? 0) > 0 && (
              <span className="text-xs text-gray-400">{p!.targetExams.slice(0, 2).join(", ")}</span>
            )}
          </div>
        </div>
      </div>

      {p?.bio && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2 leading-relaxed">{p.bio}</p>
      )}

      {(teacher.groupCourses.length > 0 || teacher.oneOnOnePackages.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {teacher.groupCourses.slice(0, 2).map((c) => (
            <span key={c.id}
              className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
              {c.title}
              <span className="text-orange-400 font-normal ml-0.5">· ₹{c.priceINR.toLocaleString("en-IN")}</span>
            </span>
          ))}
          {teacher.oneOnOnePackages.slice(0, 1).map((pkg) => (
            <span key={pkg.id}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              1-on-1 · {pkg.subject}
              <span className="text-emerald-500 font-normal ml-0.5">· ₹{pkg.priceINR.toLocaleString("en-IN")}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <span className="text-xs font-semibold text-orange-600">View profile →</span>
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
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-3">
          {/* Search bar */}
          <div className="flex items-center gap-3">
            <a href="/" className="text-orange-600 font-bold text-lg shrink-0 hidden sm:block">Novus Classes</a>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teachers or subjects…"
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
              )}
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}
              className="hidden sm:block shrink-0 text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-600 focus:outline-none focus:border-orange-400">
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
            <span className="w-px bg-gray-100 shrink-0 self-stretch" />
            {exams.map((e) => (
              <Chip key={e} label={e} active={exam === e} onClick={() => setExam(exam === e ? "" : e)} />
            ))}
            <span className="w-px bg-gray-100 shrink-0 self-stretch" />
            <Chip label="Group course" active={typeFilter === "GROUP"} onClick={() => setTypeFilter(typeFilter === "GROUP" ? "" : "GROUP")} />
            <Chip label="1-on-1" active={typeFilter === "ONE_ON_ONE"} onClick={() => setTypeFilter(typeFilter === "ONE_ON_ONE" ? "" : "ONE_ON_ONE")} />
          </div>

          {/* Mobile: sort + count */}
          <div className="flex items-center justify-between sm:hidden">
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-gray-600 focus:outline-none">
              <option value="default">Relevant</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
              <option value="date_asc">Starts soon</option>
            </select>
            <span className="text-sm text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-4xl mx-auto px-4 py-5">
        <p className="hidden sm:block text-sm text-gray-400 mb-4">
          {filtered.length} teacher{filtered.length !== 1 ? "s" : ""}
          {hasFilters && <> · <button onClick={clearAll} className="text-orange-600 hover:underline">clear filters</button></>}
        </p>

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No teachers found</h3>
            <p className="text-sm text-gray-500 mb-6">
              {hasFilters ? "Try removing a filter or searching by name." : "No teachers available right now."}
            </p>
            {hasFilters && (
              <button onClick={clearAll}
                className="px-5 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 transition-colors">
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
          <p className="text-center text-xs text-gray-300 mt-10 pb-6">
            All teachers are verified by our team before appearing here.
          </p>
        )}
      </div>
    </div>
  );
}
