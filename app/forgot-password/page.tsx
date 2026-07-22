"use client";

import { useState } from "react";
import Link from "next/link";

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-3 text-sm text-ink placeholder:text-ink-soft shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Always resolves to the same generic state — the API never reveals whether
    // the email exists, so neither does this page.
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setLoading(false);
    setSent(true);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-paper px-4 py-12">
      <a href="/" className="mb-10 flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-ink">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] bg-accent text-base font-extrabold text-white">N</span>
        <span>Novus <span className="text-accent">Classes</span></span>
      </a>

      <div className="w-full max-w-sm">
        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl bg-accent-tint flex items-center justify-center mx-auto mb-5 text-2xl">📧</div>
            <h1 className="text-2xl font-bold text-ink mb-2">Check your email</h1>
            <p className="text-sm text-ink-soft leading-relaxed mb-6">
              If an account exists for <span className="font-medium text-ink">{email}</span>, a password reset link is on its way. The link expires in 60 minutes.
            </p>
            <Link href="/login" className="inline-block text-sm font-semibold text-accent hover:text-accent-dark">← Back to sign in</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-ink mb-1.5 text-center">Forgot your password?</h1>
            <p className="text-sm text-ink-soft text-center mb-8 leading-relaxed">
              Enter your email and we&apos;ll send you a link to reset it.
            </p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="you@example.com" className={inputCls} />
              </div>
              <button type="submit" disabled={loading || !email.includes("@")}
                className="w-full py-3 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-dark disabled:opacity-50 transition-colors shadow-sm">
                {loading ? "Sending…" : "Send reset link"}
              </button>
              <p className="text-center text-sm text-ink-soft">
                Remembered it?{" "}
                <Link href="/login" className="text-accent hover:text-accent-dark font-medium">Sign in</Link>
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
