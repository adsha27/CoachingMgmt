"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProposeSlotButton({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  async function propose(e: React.FormEvent) {
    e.preventDefault();
    if (!date) { setError("Pick a date."); return; }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/bookings/${bookingId}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposedDate: date, proposedStartTime: time }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-emerald-600 hover:underline"
      >
        + Propose next session
      </button>
    );
  }

  return (
    <form onSubmit={propose} className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
      <p className="text-xs font-medium text-gray-700">Propose a slot</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          min={minDateStr}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send proposal"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-gray-500 text-xs rounded hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
