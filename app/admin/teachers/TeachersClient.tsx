"use client";

import { useState } from "react";
import SendResetButton from "../SendResetButton";

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  teacherProfile: { verifyStatus: string; subjects: string[]; rating: number | null } | null;
  teacherToken: { token: string; deletedAt: string | null } | null;
}

const VERIFY_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  VERIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  MORE_INFO_REQUESTED: "bg-blue-100 text-blue-700",
};

const VERIFY_LABEL: Record<string, string> = {
  MORE_INFO_REQUESTED: "More Info",
};

export default function TeachersClient({ teachers: initial }: { teachers: Teacher[] }) {
  const [teachers, setTeachers] = useState(initial);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  async function toggleSuspend(t: Teacher) {
    setLoading(t.id);
    setError(null);
    const res = await fetch(`/api/admin/teacher/${t.id}/suspend`, { method: "POST" });
    setLoading(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed");
      return;
    }
    const { status } = await res.json() as { status: string };
    setTeachers((prev) => prev.map((x) => x.id === t.id ? { ...x, status } : x));
  }

  if (teachers.length === 0) {
    return <p className="text-sm text-gray-500">No teachers yet.</p>;
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}
      {teachers.map((t) => {
        const scheduleUrl = t.teacherToken && !t.teacherToken.deletedAt
          ? `${baseUrl}/schedule/${t.teacherToken.token}`
          : null;
        const verifyStatus = t.teacherProfile?.verifyStatus ?? "UNVERIFIED";
        const isSuspended = t.status === "SUSPENDED";

        return (
          <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${VERIFY_BADGE[verifyStatus] ?? "bg-gray-100 text-gray-500"}`}>
                    {VERIFY_LABEL[verifyStatus] ?? verifyStatus}
                  </span>
                  {isSuspended && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">SUSPENDED</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{t.email} · {t.phone}</p>
                {(t.teacherProfile?.subjects?.length ?? 0) > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{t.teacherProfile!.subjects.join(", ")}</p>
                )}
                {scheduleUrl && (
                  <p className="text-xs mt-1">
                    <span className="text-gray-400">Schedule: </span>
                    <a href={scheduleUrl} target="_blank" rel="noopener noreferrer"
                      className="text-orange-600 hover:underline break-all">
                      {scheduleUrl}
                    </a>
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Joined {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
              <SendResetButton userId={t.id} />
              <button
                onClick={() => toggleSuspend(t)}
                disabled={loading === t.id}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-md font-medium disabled:opacity-50 ${
                  isSuspended
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                {loading === t.id ? "…" : isSuspended ? "Unsuspend" : "Suspend"}
              </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
