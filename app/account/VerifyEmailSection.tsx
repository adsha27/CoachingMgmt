"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmailSection({ email, verified }: { email: string; verified: boolean }) {
  const router = useRouter();
  const [stage, setStage] = useState<"idle" | "sending" | "entering" | "done">(verified ? "done" : "idle");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    setStage("sending"); setError(null);
    const res = await fetch("/api/auth/verify-email/send", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Could not send the code."); setStage("idle"); return; }
    if (data.alreadyVerified) { setStage("done"); router.refresh(); return; }
    setStage("entering");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await fetch("/api/auth/verify-email", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Could not verify."); return; }
    setStage("done");
    router.refresh();
  }

  if (stage === "done") {
    return (
      <p className="text-sm text-green-700 flex items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs">✓</span>
        Email confirmed
      </p>
    );
  }

  return (
    <div>
      <p className="text-sm text-amber-700 mb-3">
        <span className="font-medium">Not confirmed yet.</span>{" "}
        Confirming {email} lets you recover your account if you forget your password.
      </p>

      {stage === "entering" ? (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm text-gray-600">We sent a 6-digit code to <span className="font-medium">{email}</span>.</p>
          <input
            inputMode="numeric" autoFocus maxLength={6} value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="w-40 rounded-md border border-gray-300 px-3 py-2 text-lg tracking-[0.4em] font-mono focus:border-orange-500 focus:outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy || code.length !== 6}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">
              {busy ? "Confirming…" : "Confirm"}
            </button>
            <button type="button" onClick={send}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
              Resend
            </button>
          </div>
        </form>
      ) : (
        <>
          <button onClick={send} disabled={stage === "sending"}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50">
            {stage === "sending" ? "Sending…" : "Send confirmation code"}
          </button>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </>
      )}
    </div>
  );
}
