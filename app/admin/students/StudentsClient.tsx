"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/students");
    setStudents(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Failed to add student");
    } else {
      setName("");
      setPhone("");
      setEmail("");
      await load();
    }
    setSubmitting(false);
  }

  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-sm text-indigo-600 hover:underline">
          &larr; Sessions
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleAdd}
        className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Add student</h2>
        <div className="grid grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-3 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add student"}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-gray-500">No students yet.</p>
      ) : (
        <div className="space-y-3">
          {students.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <p className="text-sm text-gray-500">
                    {s.email} &middot; {s.phone}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    s.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
