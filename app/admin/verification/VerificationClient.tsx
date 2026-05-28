"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type VerifyStatus = "PENDING" | "VERIFIED" | "REJECTED" | "MORE_INFO_REQUESTED";

interface Item {
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string;
  joinedAt: string;
  subjects: string[];
  targetExams: string[];
  bio: string;
  qualifications: string;
  teachingExperienceYears: number | null;
  demoVideoLink: string;
  verifyStatus: VerifyStatus;
  rejectionReason: string;
}

function StatusBadge({ status }: { status: VerifyStatus }) {
  const cls =
    status === "PENDING" ? "bg-amber-100 text-amber-700" :
    status === "MORE_INFO_REQUESTED" ? "bg-blue-100 text-blue-700" :
    "bg-gray-100 text-gray-600";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{status.replace(/_/g, " ")}</span>
  );
}

export default function VerificationClient({ items }: { items: Item[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(teacherId: number, action: "APPROVE" | "REJECT" | "MORE_INFO_REQUESTED") {
    if ((action === "REJECT" || action === "MORE_INFO_REQUESTED") && !reason.trim()) {
      setError("Provide a reason");
      return;
    }
    setLoading(teacherId);
    setError(null);
    const res = await fetch(`/api/admin/teacher/${teacherId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: reason.trim() || undefined }),
    });
    setLoading(null);
    if (!res.ok) {
      setError((await res.json()).error ?? "Failed");
      return;
    }
    setReason("");
    setExpanded(null);
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← Admin</Link>
          <h1 className="text-2xl font-bold text-gray-900">Verification Queue</h1>
        </div>
        <p className="text-sm text-gray-500">No pending verifications.</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← Admin</Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Verification Queue <span className="text-base font-normal text-gray-500">({items.length})</span>
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.teacherId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === item.teacherId ? null : item.teacherId)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{item.teacherName}</span>
                  <StatusBadge status={item.verifyStatus} />
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {item.subjects.join(", ")} · Joined {new Date(item.joinedAt).toLocaleDateString("en-IN")}
                </p>
              </div>
              <span className="text-gray-400 text-lg">{expanded === item.teacherId ? "▲" : "▼"}</span>
            </button>

            {expanded === item.teacherId && (
              <div className="px-5 pb-5 border-t border-gray-100 space-y-4">
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">Phone</p>
                    <p className="text-gray-900">{item.teacherPhone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">Email</p>
                    <p className="text-gray-900">{item.teacherEmail || "—"}</p>
                  </div>
                  {(item.teachingExperienceYears ?? 0) > 0 && (
                    <div>
                      <p className="text-gray-500 text-xs font-medium mb-1">Experience</p>
                      <p className="text-gray-900">{item.teachingExperienceYears} years</p>
                    </div>
                  )}
                  {item.targetExams.length > 0 && (
                    <div>
                      <p className="text-gray-500 text-xs font-medium mb-1">Exams</p>
                      <p className="text-gray-900">{item.targetExams.join(", ")}</p>
                    </div>
                  )}
                </div>

                {item.bio && (
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">Bio</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{item.bio}</p>
                  </div>
                )}
                {item.qualifications && (
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">Qualifications</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{item.qualifications}</p>
                  </div>
                )}
                {item.demoVideoLink && (
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">Demo video</p>
                    <a href={item.demoVideoLink} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:underline">{item.demoVideoLink}</a>
                  </div>
                )}
                {item.rejectionReason && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                    Previous note: {item.rejectionReason}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note / Reason (required for Reject and Request Info)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder="Optional for Approve"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => act(item.teacherId, "APPROVE")}
                    disabled={loading === item.teacherId}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => act(item.teacherId, "MORE_INFO_REQUESTED")}
                    disabled={loading === item.teacherId}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Request info
                  </button>
                  <button
                    onClick={() => act(item.teacherId, "REJECT")}
                    disabled={loading === item.teacherId}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
