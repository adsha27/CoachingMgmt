"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PendingTeacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export default function PendingTeachersSection({ teachers: initial }: { teachers: PendingTeacher[] }) {
  const router = useRouter();
  const [teachers, setTeachers] = useState(initial);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(id: number, action: "approve" | "reject") {
    setLoading(id); setError(null);
    const res = await fetch(`/api/admin/teacher/${id}/approve`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Something went wrong");
      return;
    }
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    router.refresh();
  }

  if (teachers.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">
        Teacher approvals
        <span className="ml-2 text-xs font-semibold text-white bg-amber-600 px-2 py-0.5 rounded-full align-middle">{teachers.length}</span>
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Approving activates the account and lists the teacher on the marketplace — no separate verification step.
      </p>
      {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      <div className="space-y-3">
        {teachers.map((t) => (
          <div key={t.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                  <span>📧 {t.email}</span>
                  <span>📱 {t.phone}</span>
                  <span>Registered {new Date(t.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => decide(t.id, "approve")}
                  disabled={loading === t.id}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading === t.id ? "…" : "Approve & list"}
                </button>
                <button
                  onClick={() => decide(t.id, "reject")}
                  disabled={loading === t.id}
                  className="px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-md hover:bg-red-200 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
