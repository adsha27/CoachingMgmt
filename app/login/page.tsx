"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Step = "phone" | "code" | "register";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [regToken, setRegToken] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
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
    if (res.status === 429) {
      setError("Too many requests. Try again in an hour.");
    } else if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Could not send OTP");
    } else {
      setStep("code");
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Verification failed");
      return;
    }
    if (data.needs_registration) {
      setRegToken(data.registration_token);
      setStep("register");
      return;
    }
    router.replace(next || data.redirect || "/");
  }

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registration_token: regToken, name, email, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      return;
    }
    router.replace(next || data.redirect || "/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          {step === "register" ? "Create your account" : "Sign in"}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          {step === "phone" && "Enter your mobile number to receive an OTP."}
          {step === "code" && `OTP sent to ${phone}. Enter it below.`}
          {step === "register" && "Your number is verified — just a few more details."}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        {step === "phone" && (
          <form onSubmit={requestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile number
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
                required
                autoFocus
                placeholder="9876543210"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                6-digit OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
                placeholder="123456"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-lg font-mono tracking-widest text-center shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("phone"); setCode(""); setError(null); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              ← Change number
            </button>
          </form>
        )}

        {step === "register" && (
          <form onSubmit={register} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                placeholder="Riya Sharma"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="riya@example.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">I am a…</label>
              <div className="flex gap-3">
                {(["STUDENT", "TEACHER"] as const).map((r) => (
                  <label key={r} className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={role === r}
                      onChange={() => setRole(r)}
                      className="sr-only"
                    />
                    <div className={`rounded-md border px-4 py-2 text-sm font-medium text-center transition-colors ${
                      role === r
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}>
                      {r === "STUDENT" ? "Student" : "Teacher"}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
