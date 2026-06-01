"use client";

import { useState } from "react";

interface Props {
  groupCourseId?: number;
  oneOnOnePackageId?: number;
}

export default function InviteLinkButton({ groupCourseId, oneOnOnePackageId }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "copied">("idle");

  async function handleClick() {
    setState("loading");
    try {
      const res = await fetch("/api/teacher/invite-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupCourseId, oneOnOnePackageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      await navigator.clipboard.writeText(data.url);
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
    >
      {state === "loading" ? "…" : state === "copied" ? "Copied!" : "Invite link"}
    </button>
  );
}
