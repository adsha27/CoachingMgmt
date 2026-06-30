"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PublishCourseButton({ id, type }: { id: number; type: "group" | "package" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function publish() {
    setLoading(true);
    setError(null);
    const url = type === "group"
      ? `/api/teacher/courses/group/${id}`
      : `/api/teacher/packages/${id}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish" }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={publish}
        disabled={loading}
        className="text-xs px-3 py-1.5 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 font-medium"
      >
        {loading ? "…" : "Publish"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
