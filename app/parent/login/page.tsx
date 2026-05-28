"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "phone" | "code";

export default function ParentLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to send OTP.");
      return;
    }
    setStep("code");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/parent/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Invalid code.");
      return;
    }
    router.push("/parent/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Parent Access</h1>
        <p className="text-sm text-gray-500 mb-6">
          {step === "phone"
            ? "Enter your phone number to receive a one-time code."
            : `Enter the code sent to ${phone}.`}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
        )}

        {step === "phone" ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none tracking-widest text-center"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("phone"); setCode(""); setError(null); }}
              className="w-full text-sm text-gray-500 hover:underline"
            >
              ← Change number
            </button>
          </form>
        )}

        <p className="text-xs text-gray-400 text-center mt-6">
          Your child must add you as a parent first. Ask them to go to Settings → Parent Access.
        </p>
      </div>
    </main>
  );
}
