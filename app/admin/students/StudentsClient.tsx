"use client";

import { useMemo, useState } from "react";
import SendResetButton from "../SendResetButton";

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  targetExam: string | null;
  currentClass: string | null;
  createdAt: string;
  enrolled: number;
  pending: number;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

export default function StudentsClient({ students }: { students: Student[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return students;
    return students.filter((s) =>
      s.name.toLowerCase().includes(t) ||
      s.email.toLowerCase().includes(t) ||
      s.phone.includes(t) ||
      (s.targetExam ?? "").toLowerCase().includes(t),
    );
  }, [q, students]);

  if (students.length === 0) {
    return <p className="text-sm text-gray-500">No students registered yet.</p>;
  }

  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, email, phone, or exam…"
        className="w-full mb-4 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500">No students match &ldquo;{q}&rdquo;.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[s.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {s.status}
                    </span>
                    {[s.targetExam, s.currentClass].filter(Boolean).length > 0 && (
                      <span className="text-xs text-gray-400">
                        {[s.targetExam, s.currentClass].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <a href={`mailto:${s.email}`} className="hover:text-orange-600 hover:underline">{s.email}</a>
                    {" · "}
                    <a href={`tel:${s.phone}`} className="hover:text-orange-600 hover:underline">{s.phone}</a>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {s.enrolled} enrolled · {s.pending} awaiting approval · Joined{" "}
                    {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="shrink-0">
                  <SendResetButton userId={s.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
