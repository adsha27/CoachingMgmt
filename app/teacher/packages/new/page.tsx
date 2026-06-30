"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology"];
const EXAMS = ["JEE Main", "JEE Advanced", "NEET", "CUET"];
const DURATIONS = [30, 45, 60, 90, 120];

export default function NewPackagePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    subject: "Physics",
    targetExam: "",
    description: "",
    totalSessions: 10,
    sessionDurationMinutes: 60,
    priceINR: "",
  });

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.priceINR || isNaN(Number(form.priceINR))) { setError("Enter a valid price."); return; }

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/teacher/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, priceINR: Number(form.priceINR) }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to create package.");
      return;
    }
    router.push("/teacher/dashboard");
  }

  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/teacher/dashboard" className="text-sm text-orange-600 hover:underline">← Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900">New 1-on-1 Package</h1>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={submit} className="space-y-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Package Title</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g., JEE Physics 1-on-1 Doubt Clearing"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
            >
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Exam <span className="text-gray-400">(optional)</span></label>
            <select
              value={form.targetExam}
              onChange={(e) => set("targetExam", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
            >
              <option value="">— None —</option>
              {EXAMS.map((ex) => <option key={ex}>{ex}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What's included, teaching approach, who this is for…"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sessions</label>
            <input
              type="number"
              min={1}
              max={100}
              required
              value={form.totalSessions}
              onChange={(e) => set("totalSessions", Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <select
              value={form.sessionDurationMinutes}
              onChange={(e) => set("sessionDurationMinutes", Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
            >
              {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
            <input
              type="number"
              min={0}
              required
              value={form.priceINR}
              onChange={(e) => set("priceINR", e.target.value)}
              placeholder="e.g., 5000"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Students will book this package and then propose session slots. Each proposed slot, once confirmed, creates a Meet session.
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create Package (save as draft)"}
        </button>
      </form>
    </main>
  );
}
