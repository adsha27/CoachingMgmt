"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelRequestButton({ sessionId }: { sessionId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) { setError("Reason is required."); return; }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/teacher/cancellation-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, reason: reason.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to submit request.");
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="mt-5 pt-5 border-t border-gray-100">
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          ✓ Cancellation request submitted. Awaiting admin approval.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 pt-5 border-t border-gray-100">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-red-600 hover:underline"
        >
          Request cancellation
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Request session cancellation</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for cancellation (students will be notified)"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none resize-none"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Submitting…" : "Submit request"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-gray-500 text-sm rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-400">Admin must approve before the session is cancelled.</p>
        </form>
      )}
    </div>
  );
}
