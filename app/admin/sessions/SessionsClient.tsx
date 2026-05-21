"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SessionRow {
  id: number;
  subject: string;
  scheduledDate: string;
  durationMinutes: number;
  meetLink: string | null;
  status: string;
  cancelReason: string | null;
  emailError: string | null;
  teacher: { name: string };
  students: { student: { name: string } }[];
}

export default function SessionsClient({ sessions }: { sessions: SessionRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SessionRow | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function markComplete(id: number) {
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/sessions/${id}`, { method: "PATCH" });
    setBusy(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to mark complete");
    } else {
      router.refresh();
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setBusy(cancelTarget.id);
    setError(null);
    const res = await fetch(`/api/sessions/${cancelTarget.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason.trim() || undefined }),
    });
    setBusy(null);
    setCancelTarget(null);
    setReason("");
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to cancel session");
    } else {
      router.refresh();
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Cancel dialog */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Cancel session</h2>
            <p className="text-sm text-gray-500 mb-4">
              <strong>{cancelTarget.subject}</strong> ·{" "}
              {new Date(cancelTarget.scheduledDate).toLocaleString("en-IN")}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              A cancellation email will be sent to the teacher and all enrolled students.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Teacher unavailable"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm mb-5"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setCancelTarget(null); setReason(""); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Keep session
              </button>
              <button
                onClick={confirmCancel}
                disabled={busy === cancelTarget.id}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {busy === cancelTarget.id ? "Cancelling…" : "Confirm cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No sessions yet.{" "}
          <Link href="/admin/sessions/new" className="text-indigo-600 hover:underline">
            Schedule one
          </Link>{" "}
          to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{session.subject}</span>
                    <StatusBadge status={session.status} />
                    {session.emailError && (
                      <span
                        className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full"
                        title={session.emailError}
                      >
                        Email failed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {session.teacher.name} ·{" "}
                    {new Date(session.scheduledDate).toLocaleString("en-IN")} ·{" "}
                    {session.durationMinutes} min
                  </p>
                  {session.students.length > 0 && (
                    <p className="text-sm text-gray-400 mt-0.5">
                      {session.students.map((ss) => ss.student.name).join(", ")}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 items-center">
                    {session.meetLink && (
                      <a
                        href={session.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:underline"
                      >
                        Join Meet
                      </a>
                    )}
                    {session.cancelReason && (
                      <p className="text-sm text-red-500">
                        Cancelled: {session.cancelReason}
                      </p>
                    )}
                  </div>
                </div>

                {session.status === "SCHEDULED" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => markComplete(session.id)}
                      disabled={busy === session.id}
                      className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {busy === session.id ? "…" : "Complete"}
                    </button>
                    <button
                      onClick={() => setCancelTarget(session)}
                      disabled={busy === session.id}
                      className="text-xs px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colours[status] ?? ""}`}>
      {status}
    </span>
  );
}
