"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ParentRecord {
  id: number;
  parentName: string;
  parentPhone: string;
  parentEmail: string | null;
  verified: boolean;
}

export default function ParentAccessSection({ parents: initial }: { parents: ParentRecord[] }) {
  const router = useRouter();
  const [parents, setParents] = useState(initial);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function addParent(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const res = await fetch("/api/student/parent-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentName: name, parentPhone: phone, parentEmail: email || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed.");
      return;
    }
    const data = await res.json() as { id: number; parentName: string };
    setParents((prev) => [...prev, { id: data.id, parentName: data.parentName, parentPhone: phone, parentEmail: email || null, verified: false }]);
    setName(""); setPhone(""); setEmail("");
    setOpen(false);
    setSuccess(`OTP sent to ${phone}. Ask ${data.parentName} to verify at /parent/login.`);
    router.refresh();
  }

  return (
    <section className="mt-8 pt-6 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">Parent Access</h2>
        <button onClick={() => setOpen(!open)} className="text-sm text-indigo-600 hover:underline">
          + Add parent
        </button>
      </div>

      {success && <p className="text-xs text-green-600 mb-3">{success}</p>}

      {parents.length === 0 && !open && (
        <p className="text-sm text-gray-500">No parents added yet. Parents get read-only access to your sessions.</p>
      )}

      {parents.length > 0 && (
        <div className="space-y-2 mb-3">
          {parents.map((p) => (
            <div key={p.id} className="flex justify-between items-center bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm">
              <div>
                <span className="font-medium text-gray-800">{p.parentName}</span>
                <span className="text-gray-400 ml-2">{p.parentPhone}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.verified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {p.verified ? "Verified" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      )}

      {open && (
        <form onSubmit={addParent} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Parent name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Adding…" : "Add & send OTP"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-gray-500 text-xs rounded hover:bg-gray-100">
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-400">An OTP will be sent to the parent&apos;s phone for verification.</p>
        </form>
      )}
    </section>
  );
}
