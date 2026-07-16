"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/_components/Toast";

interface Application {
  id: number;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  targetExam: string | null;
  currentClass: string | null;
  classTitle: string;
  kind: string;
}

export default function ApplicationsSection({ applications: initial }: { applications: Application[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [applications, setApplications] = useState(initial);
  const [loading, setLoading] = useState<number | null>(null);

  async function respond(id: number, action: "approve" | "reject") {
    setLoading(id);
    const res = await fetch(`/api/teacher/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast(body.error ?? "Something went wrong", "error");
      return;
    }
    setApplications((prev) => prev.filter((a) => a.id !== id));
    toast(action === "approve" ? "Student approved — they can now join the class" : "Application declined", action === "approve" ? "success" : "info");
    router.refresh();
  }

  if (applications.length === 0) return null;

  return (
    <section>
      <h2 className="text-base font-bold text-gray-900 mb-3">
        Class applications
        <span className="ml-2 text-xs font-semibold text-white bg-orange-600 px-2 py-0.5 rounded-full align-middle">{applications.length}</span>
      </h2>
      <div className="space-y-3">
        {applications.map((a) => (
          <div key={a.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="mb-3">
              <p className="font-semibold text-gray-900 text-sm">{a.studentName}</p>
              <p className="text-xs text-gray-500">
                Applied to <strong>{a.classTitle}</strong> · {a.kind}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                <span>📧 <a href={`mailto:${a.studentEmail}`} className="underline">{a.studentEmail}</a></span>
                <span>📱 <a href={`tel:${a.studentPhone}`} className="underline">{a.studentPhone}</a></span>
                {a.targetExam && <span>🎯 {a.targetExam}</span>}
                {a.currentClass && <span>🎓 {a.currentClass}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => respond(a.id, "approve")}
                disabled={loading === a.id}
                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading === a.id ? "…" : "Approve"}
              </button>
              <button
                onClick={() => respond(a.id, "reject")}
                disabled={loading === a.id}
                className="px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-md hover:bg-red-200 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
