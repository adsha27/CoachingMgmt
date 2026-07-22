"use client";

import { useState } from "react";

// Admin-triggered password reset. Sends the same single-use link the user would
// get themselves — an admin never sees or sets someone's password.
export default function SendResetButton({ userId }: { userId: number }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function send() {
    setState("sending");
    const res = await fetch(`/api/admin/users/${userId}/send-password-reset`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error ?? "Could not send.");
      setState("error");
      return;
    }
    setState("sent");
  }

  if (state === "sent") return <span className="text-xs text-green-700 font-medium">Reset link sent ✓</span>;

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={send}
        disabled={state === "sending"}
        className="text-xs px-2.5 py-1 rounded-md font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
      >
        {state === "sending" ? "Sending…" : "Send reset link"}
      </button>
      {state === "error" && <span className="text-xs text-red-600">{message}</span>}
    </span>
  );
}
