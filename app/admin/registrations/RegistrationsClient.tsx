"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PendingUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  teacherProfile: {
    subjects: string[];
    bio: string | null;
    verifyStatus: string;
  } | null;
}

export default function RegistrationsClient({ users }: { users: PendingUser[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve(id: number) {
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/admin/registrations/${id}/approve`, { method: "POST" });
    setBusy(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Approve failed");
    } else {
      router.refresh();
    }
  }

  async function reject(id: number) {
    if (!confirm("Reject this registration? This cannot be undone.")) return;
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/admin/registrations/${id}/reject`, { method: "POST" });
    setBusy(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Reject failed");
    } else {
      router.refresh();
    }
  }

  if (users.length === 0) {
    return (
      <p className="text-sm text-gray-500">No pending registrations.</p>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="space-y-3">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{u.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.role === "TEACHER"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {u.role}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{u.email} · {u.phone}</p>
                {u.teacherProfile && (
                  <p className="text-sm text-gray-400 mt-0.5">
                    Subjects: {u.teacherProfile.subjects.join(", ")}
                    {u.teacherProfile.bio && ` — ${u.teacherProfile.bio}`}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Applied {new Date(u.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => approve(u.id)}
                  disabled={busy === u.id}
                  className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {busy === u.id ? "…" : "Approve"}
                </button>
                <button
                  onClick={() => reject(u.id)}
                  disabled={busy === u.id}
                  className="text-xs px-3 py-1.5 bg-white border border-gray-300 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
