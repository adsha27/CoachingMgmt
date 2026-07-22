"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const EXAMS = ["JEE Main", "JEE Advanced", "NEET", "CUET"];
const CLASSES = ["Class 11", "Class 12", "Dropper"];

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-3 text-sm text-ink placeholder:text-ink-soft shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawNext = searchParams.get("next") ?? "";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "";
  const isTeacherPortal = searchParams.get("portal") === "teacher";
  const applyCourseId = searchParams.get("applyCourseId");
  const applyPackageId = searchParams.get("applyPackageId");
  const applying = Boolean(applyCourseId || applyPackageId);

  // Arriving from an "Apply" link → start on register, as a student.
  const [mode, setMode] = useState<"signin" | "register">(applying ? "register" : "signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"STUDENT" | "TEACHER">(isTeacherPortal ? "TEACHER" : "STUDENT");
  const [targetExam, setTargetExam] = useState("");
  const [currentClass, setCurrentClass] = useState("");

  async function signin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Could not sign in. Please try again."); return; }
    router.replace(next || data.redirect || "/");
  }

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, email, phone, password, role,
        ...(role === "STUDENT" ? { targetExam, currentClass } : {}),
        ...(applyCourseId ? { applyCourseId: Number(applyCourseId) } : {}),
        ...(applyPackageId ? { applyPackageId: Number(applyPackageId) } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Could not create your account. Please try again."); return; }
    if (data.pending) { setPendingApproval(true); return; } // teacher — awaiting admin approval
    router.replace(next || data.redirect || "/");
  }

  const title = mode === "signin"
    ? (isTeacherPortal ? "Teacher sign in" : "Sign in")
    : (applying ? "Create your profile to apply" : "Create your account");
  const subtitle = mode === "signin"
    ? "Enter your email and password."
    : "Set an email and password. You'll use them to sign in.";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-paper px-4 py-12">
      <a href="/" className="mb-10 flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-ink">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] bg-accent text-base font-extrabold text-white">N</span>
        <span>Novus <span className="text-accent">Classes</span></span>
      </a>

      <div className="w-full max-w-sm">
        {pendingApproval ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl bg-warn-tint flex items-center justify-center mx-auto mb-5 text-2xl">⏳</div>
            <h1 className="text-2xl font-bold text-ink mb-2">Account created</h1>
            <p className="text-sm text-ink-soft leading-relaxed mb-6">
              Your teacher account is <span className="font-medium text-ink">awaiting admin approval</span>. You&apos;ll be able to sign in once our team approves it.
            </p>
            <a href="/" className="inline-block text-sm font-semibold text-accent hover:text-accent-dark">← Back to home</a>
          </div>
        ) : (
        <>
        <h1 className="text-2xl font-bold text-ink mb-1.5 text-center">{title}</h1>
        <p className="text-sm text-ink-soft text-center mb-8 leading-relaxed">{subtitle}</p>

        {error && (
          <div role="alert" aria-live="polite" className="mb-5 px-4 py-3 bg-danger-tint rounded-lg text-sm font-medium text-danger">{error}</div>
        )}

        {mode === "signin" ? (
          <form onSubmit={signin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="you@example.com" className={inputCls} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-ink">Password</label>
                <Link href="/forgot-password" className="text-xs font-medium text-accent hover:text-accent-dark">Forgot password?</Link>
              </div>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className={`${inputCls} pr-16`} />
                <button type="button" onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-accent hover:text-accent-dark">
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading || !email.includes("@") || !password}
              className="w-full py-3 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-dark disabled:opacity-50 transition-colors shadow-sm">
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <p className="text-center text-sm text-ink-soft">
              New here?{" "}
              <button type="button" onClick={() => { setMode("register"); setError(null); }} className="text-accent hover:text-accent-dark font-medium">
                Create an account
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={register} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Full name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Arjun Mehta" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Mobile number</label>
              <div className="flex rounded-lg border border-line overflow-hidden focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all shadow-sm">
                <span className="flex items-center pl-3 pr-2 text-sm text-ink-soft bg-surface-sunken border-r border-line select-none shrink-0">+91</span>
                <input type="tel" inputMode="numeric" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  required placeholder="98765 43210" className="flex-1 px-3 py-3 text-sm bg-surface text-ink placeholder:text-ink-soft outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" className={inputCls} />
            </div>

            {!isTeacherPortal && !applying && (
              <div>
                <label className="block text-sm font-medium text-ink mb-2">I am a…</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["STUDENT", "TEACHER"] as const).map((r) => (
                    <label key={r} className="cursor-pointer">
                      <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
                      <div className={`rounded-lg border-2 px-4 py-3 text-sm font-semibold text-center transition-all ${
                        role === r ? "border-accent bg-accent-tint text-accent" : "border-line text-ink-soft hover:border-ink-soft"
                      }`}>
                        {r === "STUDENT" ? "🎓 Student" : "👨‍🏫 Teacher"}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {role === "STUDENT" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Target exam</label>
                  <select value={targetExam} onChange={(e) => setTargetExam(e.target.value)} className={inputCls}>
                    <option value="">Select…</option>
                    {EXAMS.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Current class</label>
                  <select value={currentClass} onChange={(e) => setCurrentClass(e.target.value)} className={inputCls}>
                    <option value="">Select…</option>
                    {CLASSES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading || !email.includes("@") || password.length < 8 || phone.length < 10 || !name}
              className="w-full py-3 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-dark disabled:opacity-50 transition-colors shadow-sm">
              {loading ? "Creating account…" : applying ? "Create profile & apply" : "Create account"}
            </button>
            <p className="text-center text-sm text-ink-soft">
              Already have an account?{" "}
              <button type="button" onClick={() => { setMode("signin"); setError(null); }} className="text-accent hover:text-accent-dark font-medium">
                Sign in
              </button>
            </p>
          </form>
        )}
        </>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
