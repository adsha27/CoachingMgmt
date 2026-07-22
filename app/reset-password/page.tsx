"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-3 text-sm text-ink placeholder:text-ink-soft shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Could not reset your password."); return; }
    setDone(true);
    setTimeout(() => router.replace("/login"), 2000);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-paper px-4 py-12">
      <a href="/" className="mb-10 flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-ink">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] bg-accent text-base font-extrabold text-white">N</span>
        <span>Novus <span className="text-accent">Classes</span></span>
      </a>

      <div className="w-full max-w-sm">
        {done ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl bg-accent-tint flex items-center justify-center mx-auto mb-5 text-2xl">✓</div>
            <h1 className="text-2xl font-bold text-ink mb-2">Password updated</h1>
            <p className="text-sm text-ink-soft leading-relaxed mb-6">You can now sign in with your new password. Taking you to sign in…</p>
            <Link href="/login" className="inline-block text-sm font-semibold text-accent hover:text-accent-dark">Go to sign in →</Link>
          </div>
        ) : !token ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-ink mb-2">Invalid reset link</h1>
            <p className="text-sm text-ink-soft leading-relaxed mb-6">This link is missing its token. Request a fresh reset link.</p>
            <Link href="/forgot-password" className="inline-block text-sm font-semibold text-accent hover:text-accent-dark">Request a new link →</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-ink mb-1.5 text-center">Choose a new password</h1>
            <p className="text-sm text-ink-soft text-center mb-8 leading-relaxed">Enter a new password for your account.</p>

            {error && (
              <div role="alert" aria-live="polite" className="mb-5 px-4 py-3 bg-danger-tint rounded-lg text-sm font-medium text-danger">{error}</div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">New password</label>
                <div className="relative">
                  <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    required minLength={8} autoFocus placeholder="At least 8 characters" className={`${inputCls} pr-16`} />
                  <button type="button" onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-accent hover:text-accent-dark">
                    {show ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Confirm new password</label>
                <input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  required minLength={8} placeholder="Re-enter password" className={inputCls} />
              </div>
              <button type="submit" disabled={loading || password.length < 8 || !confirm}
                className="w-full py-3 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-dark disabled:opacity-50 transition-colors shadow-sm">
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>;
}
