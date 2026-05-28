"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology"];
const EXAMS = ["JEE Main", "JEE Advanced", "NEET", "CUET"];
const DURATIONS = [30, 45, 60, 90, 120];
const WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const DAY_LABEL: Record<string, string> = {
  MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat", SUN: "Sun",
};

export default function NewGroupCoursePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    subject: "Physics",
    targetExam: "",
    description: "",
    totalSessions: 20,
    sessionDurationMinutes: 60,
    priceINR: "",
    maxStudents: 30,
    startDate: "",
    sessionTime: "18:00",
    weekDays: [] as string[],
  });

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleDay(day: string) {
    set("weekDays", form.weekDays.includes(day)
      ? form.weekDays.filter((d) => d !== day)
      : [...form.weekDays, day]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.weekDays.length === 0) { setError("Select at least one session day."); return; }
    if (!form.startDate) { setError("Pick a start date."); return; }
    if (!form.priceINR || isNaN(Number(form.priceINR))) { setError("Enter a valid price."); return; }

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/teacher/courses/group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        priceINR: Number(form.priceINR),
      }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to create course.");
      return;
    }
    router.push("/teacher/dashboard");
  }

  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/teacher/dashboard" className="text-sm text-indigo-600 hover:underline">← Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900">New Group Course</h1>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={submit} className="space-y-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g., JEE Advanced Physics 2025 Batch"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Subject + Exam */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Exam <span className="text-gray-400">(optional)</span></label>
            <select
              value={form.targetExam}
              onChange={(e) => set("targetExam", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">— None —</option>
              {EXAMS.map((ex) => <option key={ex}>{ex}</option>)}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What students will learn, syllabus coverage, batch details…"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
          />
        </div>

        {/* Session count + Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Sessions</label>
            <input
              type="number"
              min={1}
              max={200}
              required
              value={form.totalSessions}
              onChange={(e) => set("totalSessions", Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Duration</label>
            <select
              value={form.sessionDurationMinutes}
              onChange={(e) => set("sessionDurationMinutes", Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
        </div>

        {/* Price + Max students */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
            <input
              type="number"
              min={0}
              required
              value={form.priceINR}
              onChange={(e) => set("priceINR", e.target.value)}
              placeholder="e.g., 12000"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
            <input
              type="number"
              min={1}
              max={500}
              value={form.maxStudents}
              onChange={(e) => set("maxStudents", Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Schedule */}
        <div className="border-t border-gray-100 pt-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Session Schedule</p>

          {/* Days */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-2">Days of week</label>
            <div className="flex gap-2 flex-wrap">
              {WEEK_DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    form.weekDays.includes(d)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {DAY_LABEL[d]}
                </button>
              ))}
            </div>
          </div>

          {/* Start date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Earliest start date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Session time (IST)</label>
              <input
                type="time"
                value={form.sessionTime}
                onChange={(e) => set("sessionTime", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {form.weekDays.length > 0 && form.totalSessions > 0 && (
            <p className="mt-3 text-xs text-gray-500">
              Sessions will be scheduled every{" "}
              <strong>{form.weekDays.map((d) => DAY_LABEL[d]).join(", ")}</strong>{" "}
              at <strong>{form.sessionTime}</strong> IST, generating{" "}
              <strong>{form.totalSessions}</strong> sessions in total.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Creating course…" : "Create Course (save as draft)"}
        </button>
      </form>
    </main>
  );
}
