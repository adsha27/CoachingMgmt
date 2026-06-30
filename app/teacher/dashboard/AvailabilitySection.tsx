"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
type Day = (typeof DAYS)[number];

interface Slot {
  id: number;
  dayOfWeek: Day;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  specificDate: Date | string | null;
}

export default function AvailabilitySection({ slots }: { slots: Slot[] }) {
  const router = useRouter();
  const [dayOfWeek, setDayOfWeek] = useState<Day>("MON");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isRecurring, setIsRecurring] = useState(true);
  const [specificDate, setSpecificDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (endTime <= startTime) {
      setError("End time must be after start time");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/teacher/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayOfWeek,
        startTime,
        endTime,
        isRecurring,
        specificDate: !isRecurring && specificDate ? specificDate : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to add slot");
    } else {
      setStartTime(""); setEndTime(""); setSpecificDate("");
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
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Weekly availability</h2>
      <p className="text-sm text-gray-500 mb-4">
        Set your recurring availability so students can propose sessions in those windows.
      </p>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleAdd} className="space-y-3 mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value as Day)}
              className="w-full rounded-md border border-gray-300 py-1.5 px-2 text-sm focus:border-orange-500 focus:outline-none"
            >
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 py-1.5 px-2 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 py-1.5 px-2 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded border-gray-300"
            />
            Recurring every week
          </label>
          {!isRecurring && (
            <input
              type="date"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              className="rounded-md border border-gray-300 py-1 px-2 text-sm focus:border-orange-500 focus:outline-none"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="py-2 px-4 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add slot"}
        </button>
      </form>

      {slots.length === 0 ? (
        <p className="text-sm text-gray-400">No availability slots set.</p>
      ) : (
        <div className="space-y-2">
          {slots.map((slot) => (
            <div key={slot.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
              <div>
                <p className="text-sm text-gray-700 font-medium">
                  {slot.dayOfWeek} {slot.startTime}–{slot.endTime}
                  {!slot.isRecurring && slot.specificDate && (
                    <span className="text-gray-400 font-normal">
                      {" ("}
                      {new Date(slot.specificDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      {")"}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  {slot.isRecurring ? "Every week" : "One-off"}
                </p>
              </div>
              <button
                onClick={() => handleDelete(slot.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
