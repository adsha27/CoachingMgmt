"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Slot {
  id: number;
  startTime: Date | string;
  endTime: Date | string;
  note: string | null;
}

export default function AvailabilitySection({ slots }: { slots: Slot[] }) {
  const router = useRouter();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (new Date(end) <= new Date(start)) {
      setError("End time must be after start time");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/teacher/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startTime: start, endTime: end, note }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to add slot");
    } else {
      setStart(""); setEnd(""); setNote("");
      router.refresh();
    }
    setSubmitting(false);
  }

  async function handleDelete(id: number) {
    await fetch(`/api/teacher/availability/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">My availability</h2>
      <p className="text-sm text-gray-500 mb-4">
        Propose time windows — your admin uses these as reference when scheduling sessions.
      </p>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          />
        </div>
        <div className="col-span-2">
          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="col-span-2 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add slot"}
        </button>
      </form>

      {slots.length === 0 ? (
        <p className="text-sm text-gray-400">No upcoming availability slots.</p>
      ) : (
        <div className="space-y-2">
          {slots.map((slot) => (
            <div key={slot.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm text-gray-700">
                  {new Date(slot.startTime).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {" → "}
                  {new Date(slot.endTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
                {slot.note && <p className="text-xs text-gray-400">{slot.note}</p>}
              </div>
              <button
                onClick={() => handleDelete(slot.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
