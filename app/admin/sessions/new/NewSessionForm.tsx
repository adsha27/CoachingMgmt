"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
  email: string;
}

interface AvailabilitySlot {
  id: number;
  startTime: string;
  endTime: string;
  note: string | null;
}

export default function NewSessionForm({
  teachers,
  students,
}: {
  teachers: User[];
  students: User[];
}) {
  const router = useRouter();
  const [teacherId, setTeacherId] = useState("");
  const [subject, setSubject] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [studentIds, setStudentIds] = useState<number[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) {
      setAvailabilitySlots([]);
      return;
    }

    let cancelled = false;
    async function loadAvailability() {
      setAvailabilityLoading(true);
      const res = await fetch(`/api/teacher/availability/${teacherId}`);
      const data = await res.json();
      if (!cancelled) {
        setAvailabilitySlots(res.ok ? data : []);
        setAvailabilityLoading(false);
      }
    }

    loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  function toggleStudent(id: number) {
    setStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEmailWarning(null);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: Number(teacherId),
          subject,
          scheduledDate,
          durationMinutes: Number(durationMinutes),
          studentIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create session");
        return;
      }

      if (data.emailError) {
        setEmailWarning(`Session created, but email failed: ${data.emailError}`);
        setTimeout(() => router.push("/admin"), 3000);
      } else {
        router.push("/admin");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Schedule session</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}
      {emailWarning && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700">
          {emailWarning}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="teacherId" className="block text-sm font-medium text-gray-700 mb-1">
            Teacher
          </label>
          <select
            id="teacherId"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          >
            <option value="">Select teacher</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {availabilityLoading && (
            <p className="text-xs text-gray-400 mt-2">Loading availability…</p>
          )}
          {!availabilityLoading && availabilitySlots.length > 0 && (
            <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
              <h2 className="text-xs font-semibold text-indigo-900 mb-2">
                Teacher availability
              </h2>
              <div className="space-y-2">
                {availabilitySlots.map((slot) => (
                  <div key={slot.id} className="text-sm text-indigo-900">
                    <span>
                      {new Date(slot.startTime).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span> → </span>
                    <span>
                      {new Date(slot.endTime).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {slot.note && (
                      <span className="text-indigo-700"> · {slot.note}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="e.g. JEE Physics — Mechanics"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date &amp; time
            </label>
            <input
              id="scheduledDate"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div>
            <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              id="durationMinutes"
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              required
              min={15}
              max={480}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        {students.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Students
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
              {students.map((s) => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={studentIds.includes(s.id)}
                    onChange={() => toggleStudent(s.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">
                    {s.name}
                    <span className="text-gray-400 ml-1">({s.email})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create session"}
          </button>
          <a
            href="/admin"
            className="px-5 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </a>
        </div>
      </form>
    </main>
  );
}
