"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BookPackageForm({
  packageId,
  durationMinutes,
}: {
  packageId: number;
  durationMinutes: number;
}) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!date) { setError("Please pick a date for your first session."); return; }

    setLoading(true);
    setError(null);

    const scheduledAt = new Date(`${date}T${time}:00`);

    const res = await fetch("/api/bookings/one-on-one", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId, scheduledAt: scheduledAt.toISOString() }),
    });

    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Booking failed. Please try again.");
      return;
    }
    router.push("/student/dashboard");
  }

  return (
    <form onSubmit={confirm}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}

      <div className="border-t border-gray-100 pt-4 mb-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Schedule your first session</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input
              type="date"
              min={minDateStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Time (IST)</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Duration: {durationMinutes} min. Your teacher will confirm this slot.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "Booking…" : "Book Package"}
      </button>
      <p className="text-xs text-gray-400 text-center mt-2">Payment collection is handled outside this platform.</p>
    </form>
  );
}
