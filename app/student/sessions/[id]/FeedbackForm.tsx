"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FeedbackForm({ sessionId }: { sessionId: number }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) { setError("Please select a rating."); return; }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/sessions/${sessionId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to submit feedback.");
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="mt-5 pt-5 border-t border-gray-100">
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          ✓ Thank you for your feedback!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 pt-5 border-t border-gray-100 space-y-3">
      <p className="text-sm font-medium text-gray-700">Rate this session</p>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-2xl transition-transform hover:scale-110 ${rating >= star ? "text-yellow-400" : "text-gray-300"}`}
          >
            ★
          </button>
        ))}
        {rating > 0 && (
          <span className="text-sm text-gray-500 self-center ml-1">
            {["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}
          </span>
        )}
      </div>

      <textarea
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comments for your teacher…"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none resize-none"
      />

      <button
        type="submit"
        disabled={loading || !rating}
        className="px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit feedback"}
      </button>
    </form>
  );
}
