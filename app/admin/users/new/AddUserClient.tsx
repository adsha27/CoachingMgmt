"use client";

import { useState } from "react";
import Link from "next/link";

export default function AddUserClient() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; phone: string; role: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Could not create account."); return; }
    setDone({ name, phone, role });
    setName(""); setPhone(""); setEmail(""); setRole("STUDENT");
  }

  return (
    <main className="max-w-md mx-auto py-8 px-4">
      <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600">← Admin dashboard</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1.5">Add teacher or student</h1>
      <p className="text-sm text-gray-500 mb-8">
        Enter their basic details. They log in themselves with this phone number
        (a one-time code is sent to the email below) and fill in the rest — bio,
        subjects, availability — after that.
      </p>

      {done && (
        <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          {done.name} added as {done.role.toLowerCase()}. They can log in now with +91 {done.phone}.
        </div>
      )}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            required placeholder="Arjun Mehta"
            className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile number</label>
          <div className="flex rounded-xl border border-gray-300 overflow-hidden focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition-all shadow-sm">
            <span className="flex items-center pl-3 pr-2 text-sm text-gray-500 bg-gray-50 border-r border-gray-300 select-none shrink-0">+91</span>
            <input type="tel" inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              required placeholder="98765 43210"
              className="flex-1 px-3 py-3 text-sm bg-white outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            required placeholder="arjun@example.com"
            className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <div className="grid grid-cols-2 gap-3">
            {(["STUDENT", "TEACHER"] as const).map((r) => (
              <label key={r} className="cursor-pointer">
                <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
                <div className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold text-center transition-all ${
                  role === r ? "border-orange-600 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}>
                  {r === "STUDENT" ? "🎓 Student" : "👨‍🏫 Teacher"}
                </div>
              </label>
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-sm">
          {loading ? "Adding…" : "Add account"}
        </button>
      </form>
    </main>
  );
}
