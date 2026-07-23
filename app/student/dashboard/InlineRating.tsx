"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// One-tap rating, inline in the past-sessions list. Tapping a star submits
// immediately — no navigating to the session page, no required comment. A
// student who wants to leave a written note still can from the session page;
// the goal here is that leaving a rating costs a single tap.
export default function InlineRating({ sessionId }: { sessionId: number }) {
  const router = useRouter();
  const [hover, setHover] = useState(0);
  const [saved, setSaved] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function rate(stars: number) {
    if (busy) return;
    setBusy(true);
    setSaved(stars); // optimistic
    const res = await fetch(`/api/sessions/${sessionId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: stars }),
    });
    if (!res.ok) { setSaved(null); setBusy(false); return; }
    router.refresh();
  }

  if (saved) {
    return (
      <span className="text-xs text-amber-500" aria-label={`Rated ${saved} of 5`}>
        {"★".repeat(saved)}<span className="text-gray-200">{"★".repeat(5 - saved)}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5" role="group" aria-label="Rate this session">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={busy}
          onClick={() => rate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className={`text-lg leading-none transition-transform hover:scale-125 disabled:opacity-50 ${
            hover >= star ? "text-amber-400" : "text-gray-300"
          }`}
        >
          ★
        </button>
      ))}
    </span>
  );
}
