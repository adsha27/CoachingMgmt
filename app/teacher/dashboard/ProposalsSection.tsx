"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/_components/Toast";

interface Proposal {
  id: number;
  bookingId: number;
  proposedDate: string;
  proposedStartTime: string;
  studentName: string;
  packageTitle: string;
  durationMinutes: number;
}

export default function ProposalsSection({ proposals: initial }: { proposals: Proposal[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [proposals, setProposals] = useState(initial);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<number | null>(null);

  async function respond(id: number, action: "confirm" | "reject") {
    setLoading(id);
    const res = await fetch(`/api/proposals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, teacherNote: notes[id]?.trim() || undefined }),
    });
    setLoading(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast(body.error ?? "Something went wrong", "error");
      return;
    }
    setProposals((prev) => prev.filter((p) => p.id !== id));
    toast(action === "confirm" ? "Slot confirmed — session added to schedule" : "Proposal declined", action === "confirm" ? "success" : "info");
    router.refresh();
  }

  if (proposals.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="text-base font-bold text-gray-900 mb-3">Pending slot proposals</h2>
      <div className="space-y-3">
        {proposals.map((p) => {
          const date = new Date(p.proposedDate);
          const dateStr = date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
          return (
            <div key={p.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="mb-2">
                <p className="font-medium text-gray-900 text-sm">{p.studentName}</p>
                <p className="text-xs text-gray-500">{p.packageTitle} · {p.durationMinutes} min</p>
                <p className="text-sm text-gray-700 mt-1">
                  Proposes: <strong>{dateStr}</strong> at <strong>{p.proposedStartTime}</strong>
                </p>
              </div>
              <input
                type="text"
                placeholder="Note to student (optional)"
                value={notes[p.id] ?? ""}
                onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs mb-2 focus:border-indigo-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => respond(p.id, "confirm")}
                  disabled={loading === p.id}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading === p.id ? "…" : "Confirm"}
                </button>
                <button
                  onClick={() => respond(p.id, "reject")}
                  disabled={loading === p.id}
                  className="px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-md hover:bg-red-200 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
