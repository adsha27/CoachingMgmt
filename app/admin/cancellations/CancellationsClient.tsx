"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CancellationItem {
  id: number;
  teacherName: string;
  reason: string;
  createdAt: string;
  session: { id: number; scheduledAt: string; durationMinutes: number } | null;
  groupCourse: { id: number; title: string } | null;
  oneOnOnePackage: { id: number; title: string } | null;
}

export default function CancellationsClient({ items }: { items: CancellationItem[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: number, action: "APPROVED" | "REJECTED") {
    setLoading(id);
    setError(null);
    const res = await fetch(`/api/admin/cancellation-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNote: notes[id]?.trim() || undefined }),
    });
    setLoading(null);
    if (!res.ok) {
      setError((await res.json()).error ?? "Failed");
      return;
    }
    router.refresh();
  }

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">No pending cancellation requests.</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}
      {items.map((item) => (
        <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex justify-between items-start gap-4 mb-3">
            <div>
              <p className="font-semibold text-gray-900">{item.teacherName}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(item.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric"
                })}
                {item.session && ` · Session on ${new Date(item.session.scheduledAt).toLocaleDateString("en-IN")}`}
                {item.groupCourse && ` · Course: ${item.groupCourse.title}`}
                {item.oneOnOnePackage && ` · Package: ${item.oneOnOnePackage.title}`}
              </p>
            </div>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">PENDING</span>
          </div>

          <p className="text-sm text-gray-700 mb-4">
            <span className="font-medium text-gray-500 mr-1">Reason:</span>
            {item.reason}
          </p>

          <div className="space-y-3">
            <textarea
              value={notes[item.id] ?? ""}
              onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
              rows={2}
              placeholder="Admin note (optional)"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => act(item.id, "APPROVED")}
                disabled={loading === item.id}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => act(item.id, "REJECTED")}
                disabled={loading === item.id}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
