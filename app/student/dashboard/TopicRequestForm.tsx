"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/_components/Toast";

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "Other"];

export default function TopicRequestForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("Physics");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) { setError("Describe the topic you want covered."); return; }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/topic-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, topicDescription: topic.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed.");
      return;
    }
    setTopic("");
    setOpen(false);
    toast("Topic request submitted — teachers will see it as demand signal");
    router.refresh();
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-orange-600 hover:underline"
        >
          + Request a topic
        </button>
      ) : (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Request a topic</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-orange-500"
              >
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Topic description</label>
            <textarea
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Electrostatics: Gauss's law problems, or Organic chemistry: SN1/SN2 mechanisms"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-gray-500 text-xs rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
