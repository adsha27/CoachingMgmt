"use client";

import { useState } from "react";

// Reuses the existing forgot-password flow rather than adding a second way to
// set a password: we issue the same single-use token and email the same link.
// That keeps one tested path, and satisfies "password change must confirm by email".
export default function ChangePasswordButton({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function send() {
    setState("sending");
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
        <p className="text-sm font-medium text-green-800">Check your email</p>
        <p className="text-sm text-green-700 mt-0.5">
          We sent a link to <span className="font-medium">{email}</span>. Open it to set a new password. It expires in 60 minutes.
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={send}
        disabled={state === "sending"}
        className="px-4 py-2 text-sm font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
      >
        {state === "sending" ? "Sending…" : "Email me a reset link"}
      </button>
      <p className="text-xs text-gray-500 mt-2">
        For security, password changes are confirmed by email rather than done in place.
      </p>
    </div>
  );
}
