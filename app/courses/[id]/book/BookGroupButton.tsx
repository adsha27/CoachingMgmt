"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BookGroupButton({ courseId }: { courseId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/bookings/group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Enrolment failed. Please try again.");
      return;
    }
    router.push("/student/dashboard");
  }

  return (
    <div>
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}
      <button
        onClick={confirm}
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Enrolling…" : "Confirm Enrolment"}
      </button>
      <p className="text-xs text-gray-400 text-center mt-2">Payment collection is handled outside this platform.</p>
    </div>
  );
}
