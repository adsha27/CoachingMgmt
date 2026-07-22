"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MeetingLinkButton({ courseId, current }: { courseId: number; current: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState(current ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true); setError(null);
    const res = await fetch(`/api/teacher/courses/group/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-meeting-link", meetingLink: link }),
    });
    setSaving(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Could not save the link.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
          current
            ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
            : "text-gray-600 bg-gray-100 hover:bg-gray-200"
        }`}
      >
        {current ? "✓ Meeting link" : "+ Meeting link"}
      </button>
    );
  }

  return (
    <div className="w-full mt-2">
      <input
        type="url"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        autoFocus
        placeholder="https://meet.google.com/… or Zoom link"
        className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none"
      />
      <p className="text-[11px] text-gray-400 mt-1">
        Students see this only after you approve their application.
      </p>
      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
      <div className="flex gap-2 mt-2">
        <button onClick={save} disabled={saving}
          className="text-xs font-semibold px-3 py-1 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={() => { setOpen(false); setLink(current ?? ""); setError(null); }}
          className="text-xs px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  );
}
