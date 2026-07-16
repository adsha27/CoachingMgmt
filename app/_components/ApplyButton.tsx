"use client";

import { useState } from "react";
import Link from "next/link";

export default function ApplyButton({
  courseId,
  packageId,
  color = "orange",
}: {
  courseId?: number;
  packageId?: number;
  color?: "orange" | "emerald";
}) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const btn = color === "emerald"
    ? "bg-emerald-600 hover:bg-emerald-700"
    : "bg-orange-600 hover:bg-orange-700";

  async function apply() {
    setState("loading"); setError(null);
    const res = await fetch("/api/applications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseId ? { courseId } : { packageId }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Could not apply. Please try again.");
      setState("idle");
      return;
    }
    setState("done");
  }

  if (state === "done") {
    return (
      <div className="text-center py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
        ✓ Application submitted — your teacher will review it and get in touch.{" "}
        <Link href="/student/dashboard" className="underline">Go to dashboard</Link>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}
      <button onClick={apply} disabled={state === "loading"}
        className={`w-full py-3 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors ${btn}`}>
        {state === "loading" ? "Applying…" : "Apply for this class"}
      </button>
      <p className="text-xs text-gray-400 text-center mt-2">No payment now — your teacher will contact you to confirm.</p>
    </div>
  );
}
