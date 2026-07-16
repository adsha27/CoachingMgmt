"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const EXAMS = ["JEE Main", "JEE Advanced", "NEET", "CUET"];
const CLASSES = ["Class 11", "Class 12", "Dropper"];

const inputCls =
  "w-full rounded-xl border border-gray-300 px-3 py-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all";

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
    router.replace(next || data.redirect || "/");
  }

  const title = mode === "signin"
    ? (isTeacherPortal ? "Teacher sign in" : "Sign in")
    : (applying ? "Create your profile to apply" : "Create your account");
  const subtitle = mode === "signin"
    ? "Enter your email and password."
    : "Set an email and password — you'll use them to sign in.";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-12">
      <a href="/" className="mb-10 text-xl font-bold text-slate-900 tracking-tight">EduConnect</a>

      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1.5 text-center">{title}</h1>
        <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">{subtitle}</p>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}

        {mode === "signin" ? (
          <form onSubmit={signin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="you@example.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className={inputCls} />
            </div>
            <button type="submit" disabled={loading || !email.includes("@") || !password}
              className="w-full py-3 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-sm">
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <p className="text-center text-sm text-gray-500">
              New here?{" "}
              <button type="button" onClick={() => { setMode("register"); setError(null); }} className="text-orange-600 hover:text-orange-800 font-medium">
                Create an account
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={register} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Arjun Mehta" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile number</label>
              <div className="flex rounded-xl border border-gray-300 overflow-hidden focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition-all shadow-sm">
                <span className="flex items-center pl-3 pr-2 text-sm text-gray-500 bg-gray-50 border-r border-gray-300 select-none shrink-0">+91</span>
                <input type="tel" inputMode="numeric" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  required placeholder="98765 43210" className="flex-1 px-3 py-3 text-sm bg-white outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" className={inputCls} />
            </div>

            {!isTeacherPortal && !applying && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">I am a…</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["STUDENT", "TEACHER"] as const).map((r) => (
                    <label key={r} className="cursor-pointer">
                      <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
                      <div className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold text-center transition-all ${
                        role === r ? "border-orange-600 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Target exam</label>
                  <select value={targetExam} onChange={(e) => setTargetExam(e.target.value)} className={inputCls}>
                    <option value="">— Select —</option>
                    {EXAMS.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Current class</label>
                  <select value={currentClass} onChange={(e) => setCurrentClass(e.target.value)} className={inputCls}>
                    <option value="">— Select —</option>
                    {CLASSES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading || !email.includes("@") || password.length < 8 || phone.length < 10 || !name}
              className="w-full py-3 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-sm">
              {loading ? "Creating account…" : applying ? "Create profile & apply" : "Create account"}
            </button>
            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <button type="button" onClick={() => { setMode("signin"); setError(null); }} className="text-orange-600 hover:text-orange-800 font-medium">
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
