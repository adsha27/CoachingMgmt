"use client";

import { useState } from "react";
import { useToast } from "@/app/_components/Toast";

interface Props {
  groupCourseId?: number;
  oneOnOnePackageId?: number;
}

export default function InviteLinkButton({ groupCourseId, oneOnOnePackageId }: Props) {
  const [state, setState] = useState<"idle" | "loading">("idle");
  const { toast } = useToast();

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
      toast("Invite link copied to clipboard!");
    } catch {
      toast("Could not copy invite link", "error");
    } finally {
      setState("idle");
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-50 font-medium"
    >
      {state === "loading" ? "…" : "Invite link"}
    </button>
  );
}
