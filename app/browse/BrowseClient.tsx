"use client";

import { useState, useMemo } from "react";
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

export default function BrowseClient({ teachers }: { teachers: Teacher[] }) {
  const [subject, setSubject] = useState("");
  const [exam, setExam] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "GROUP" | "ONE_ON_ONE">("");
  const [sort, setSort] = useState<Sort>("default");

  const subjects = useMemo(() => allSubjects(teachers), [teachers]);
  const exams = useMemo(() => allExams(teachers), [teachers]);

  const filtered = useMemo(() => {
    let list = teachers.map((t) => {
      const gc = t.groupCourses.filter(
        (c) =>
          (!subject || c.subject === subject) &&
          (!exam || c.targetExam === exam) &&
          (!typeFilter || typeFilter === "GROUP")
      );
      const p11 = t.oneOnOnePackages.filter(
        (p) =>
          (!subject || p.subject === subject) &&
          (!exam || p.targetExam === exam) &&
          (!typeFilter || typeFilter === "ONE_ON_ONE")
      );
      return { ...t, groupCourses: gc, oneOnOnePackages: p11 };
    });

    // Remove teachers with no matching courses
    list = list.filter(
      (t) => t.groupCourses.length > 0 || t.oneOnOnePackages.length > 0
    );

    // Sort
    if (sort === "price_asc") list.sort((a, b) => minPrice(a) - minPrice(b));
    if (sort === "price_desc") list.sort((a, b) => minPrice(b) - minPrice(a));
    if (sort === "date_asc")
      list.sort((a, b) => earliestStart(a).localeCompare(earliestStart(b)));

    return list;
  }, [teachers, subject, exam, typeFilter, sort]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Browse Teachers
          </h1>
          <p className="text-sm text-gray-500">
            {filtered.length} teacher{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar filters */}
        <aside className="w-48 shrink-0 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-1.5 px-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Target exam
            </label>
            <select
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-1.5 px-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All exams</option>
              {exams.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Course type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "" | "GROUP" | "ONE_ON_ONE")}
              className="w-full rounded-md border border-gray-300 py-1.5 px-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All types</option>
              <option value="GROUP">Group course</option>
              <option value="ONE_ON_ONE">1-on-1 package</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Sort by
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="w-full rounded-md border border-gray-300 py-1.5 px-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="default">Relevant</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="date_asc">Start date: soonest</option>
            </select>
          </div>

          {(subject || exam || typeFilter) && (
            <button
              onClick={() => { setSubject(""); setExam(""); setTypeFilter(""); }}
              className="text-xs text-indigo-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </aside>

        {/* Cards */}
        <div className="flex-1 space-y-4">
          {filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400 text-sm">
              No teachers match these filters.
            </div>
          )}

          {filtered.map((teacher) => (
            <Link
              key={teacher.id}
              href={`/teacher/${teacher.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {teacher.teacherProfile?.profilePhotoUrl ? (
                    <img
                      src={teacher.teacherProfile.profilePhotoUrl}
                      alt={teacher.name}
                      className="w-12 h-12 rounded-full object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-lg">
                      {teacher.name[0]}
                    </div>
                  )}
                  <div>
                    <h2 className="font-semibold text-gray-900">{teacher.name}</h2>
                    {(teacher.teacherProfile?.subjects?.length ?? 0) > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {teacher.teacherProfile!.subjects.join(" · ")}
                      </p>
                    )}
                    {teacher.teacherProfile?.bio && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {teacher.teacherProfile.bio}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {teacher.teacherProfile?.rating && (
                    <div className="text-sm font-medium text-amber-600">
                      ★ {teacher.teacherProfile.rating.toFixed(1)}
                    </div>
                  )}
                  {teacher.teacherProfile?.teachingExperienceYears && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {teacher.teacherProfile.teachingExperienceYears}y exp
                    </div>
                  )}
                </div>
              </div>

              {/* Courses */}
              {(teacher.groupCourses.length > 0 || teacher.oneOnOnePackages.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {teacher.groupCourses.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-md bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-xs"
                    >
                      <span className="font-medium text-indigo-800">{c.title}</span>
                      <span className="text-indigo-500 ml-1">
                        · ₹{c.priceINR.toLocaleString("en-IN")}
                        · {c.totalSessions} sessions
                        · starts {new Date(c.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  ))}
                  {teacher.oneOnOnePackages.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-md bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-xs"
                    >
                      <span className="font-medium text-emerald-800">{p.title}</span>
                      <span className="text-emerald-600 ml-1">
                        · ₹{p.priceINR.toLocaleString("en-IN")}
                        · {p.totalSessions}×{p.sessionDurationMinutes}min
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
