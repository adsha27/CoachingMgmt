"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Step = "phone" | "code" | "register";
const STEPS: Step[] = ["phone", "code", "register"];

// ── OTP box input ─────────────────────────────────────────────────────────────
function OtpBoxes({ value, onChange, onComplete }: {
  value: string;
  onChange: (v: string) => void;
  onComplete: () => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function focus(i: number) {
    refs.current[i]?.focus();
    refs.current[i]?.select();
  }

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      const next = value.split("");
      if (value[i]) { next[i] = ""; onChange(next.join("")); }
      else if (i > 0) { focus(i - 1); next[i - 1] = ""; onChange(next.join("")); }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && i > 0) focus(i - 1);
    else if (e.key === "ArrowRight" && i < 5) focus(i + 1);
  }

  function handleInput(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;
    if (raw.length >= 6) {
      const digits = raw.slice(0, 6);
      onChange(digits); focus(5);
      if (digits.length === 6) setTimeout(onComplete, 80);
      return;
    }
    const next = value.split("").concat(Array(6).fill("")).slice(0, 6);
    next[i] = raw[raw.length - 1];
    const joined = next.join("");
    onChange(joined);
    if (i < 5) focus(i + 1);
    if (joined.replace(/\s/g, "").length === 6 && !joined.includes(" ")) setTimeout(onComplete, 80);
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length > 0) {
      onChange(text.padEnd(6, " ").slice(0, 6).replace(/ /g, ""));
      focus(Math.min(text.length - 1, 5));
      if (text.length === 6) setTimeout(onComplete, 80);
    }
    e.preventDefault();
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleInput(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onFocus={() => refs.current[i]?.select()}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={i === 0}
          className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-colors
            ${value[i] ? "border-orange-500 bg-orange-50 text-orange-900" : "border-gray-200 bg-white text-gray-900"}
            focus:border-orange-500 focus:ring-0`}
        />
      ))}
    </div>
  );
}

// ── Resend timer ──────────────────────────────────────────────────────────────
function ResendButton({ phone, onResent }: { phone: string; onResent: () => void }) {
  const [seconds, setSeconds] = useState(30);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  async function resend() {
    setSeconds(30);
    await fetch("/api/auth/otp/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
    onResent();
  }

  return seconds > 0
    ? <p className="text-center text-sm text-gray-400">Resend OTP in <span className="font-medium text-gray-600">{seconds}s</span></p>
    : <button type="button" onClick={resend} className="w-full text-sm text-orange-600 hover:text-orange-800 font-medium">Resend OTP</button>;
}

// ── Step components ───────────────────────────────────────────────────────────
function PhoneStep({ phone, setPhone, loading, onSubmit }: {
  phone: string;
  setPhone: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile number</label>
        <div className="flex rounded-xl border border-gray-300 overflow-hidden focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition-all shadow-sm">
          <span className="flex items-center pl-3 pr-2 text-sm text-gray-500 bg-gray-50 border-r border-gray-300 select-none shrink-0">+91</span>
          <input type="tel" inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            required autoFocus placeholder="98765 43210"
            className="flex-1 px-3 py-3 text-sm bg-white outline-none"
          />
        </div>
      </div>
      <button type="submit" disabled={loading || phone.length < 10}
        className="w-full py-3 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-sm">
        {loading ? "Sending…" : "Send OTP"}
      </button>
      <p className="text-xs text-center text-gray-400">By continuing you agree to our terms of service.</p>
    </form>
  );
}

function OtpStep({ phone, otp, setOtp, loading, onComplete, onBack, onResent }: {
  phone: string;
  otp: string;
  setOtp: (v: string) => void;
  loading: boolean;
  onComplete: () => void;
  onBack: () => void;
  onResent: () => void;
}) {
  return (
    <div className="space-y-6">
      <OtpBoxes value={otp} onChange={(v) => setOtp(v)} onComplete={onComplete} />
      {loading && <p className="text-center text-sm text-orange-600 animate-pulse">Verifying…</p>}
      <ResendButton phone={phone} onResent={onResent} />
      <button type="button" onClick={onBack} className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors">
        ← Change number
      </button>
    </div>
  );
}

function RegisterStep({ name, setName, email, setEmail, role, setRole, loading, onSubmit }: {
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  role: "STUDENT" | "TEACHER"; setRole: (v: "STUDENT" | "TEACHER") => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          required autoFocus placeholder="Arjun Mehta"
          className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          required placeholder="arjun@example.com"
          className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all" />
      </div>
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
      <button type="submit" disabled={loading}
        className="w-full py-3 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-sm">
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

// ── Step metadata ─────────────────────────────────────────────────────────────
const STEP_TITLE: Record<Step, string> = {
  phone: "Sign in or register",
  code: "Enter OTP",
  register: "Create your account",
};

// ── Main login form ───────────────────────────────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [regToken, setRegToken] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resentMsg, setResentMsg] = useState(false);

  const maskedPhone = phone.length >= 6
    ? `+91 ${phone.slice(0, 2)}××××${phone.slice(-4)}`
    : `+91 ${phone}`;

  const stepSubtitle: Record<Step, React.ReactNode> = {
    phone: "Enter your mobile number to receive a one-time code.",
    code: <>{`Code sent to `}<span className="font-medium text-gray-700">{maskedPhone}</span><br />Valid for 10 minutes.</>,
    register: "Your number is verified. Just a few more details.",
  };

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch("/api/auth/otp/request", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    setLoading(false);
    if (res.status === 429) setError("Too many requests. Wait an hour before trying again.");
    else if (!res.ok) { const d = await res.json(); setError(d.error ?? "Could not send OTP. Please try again."); }
    else setStep("code");
  }

  const submitOtp = useCallback(async () => {
    if (otp.replace(/\s/g, "").length < 6) return;
    setLoading(true); setError(null);
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code: otp.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Incorrect OTP. Please try again."); setOtp(""); return; }
    if (data.needs_registration) { setRegToken(data.registration_token); setStep("register"); return; }
    router.replace(next || data.redirect || "/");
  }, [otp, phone, next, router]);

  useEffect(() => {
    if (step === "code" && otp.replace(/\s/g, "").length === 6 && !loading) submitOtp();
  }, [otp, step, loading, submitOtp]);

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registration_token: regToken, name, email, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Registration failed. Please try again."); return; }
    router.replace(next || data.redirect || "/");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-12">
      <a href="/" className="mb-10 text-xl font-bold text-slate-900 tracking-tight">EduConnect</a>

      <div className="w-full max-w-sm">
        <div className="flex justify-center gap-1.5 mb-8">
          {(step === "register" ? STEPS : (["phone", "code"] as Step[])).map((s, i) => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${
              step === s ? "w-6 bg-orange-600" : i < (step === "register" ? STEPS : ["phone", "code"]).indexOf(step) ? "w-1.5 bg-orange-300" : "w-1.5 bg-gray-200"
            }`} />
          ))}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1.5 text-center">{STEP_TITLE[step]}</h1>
        <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">{stepSubtitle[step]}</p>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}
        {resentMsg && (
          <div className="mb-5 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">OTP resent successfully.</div>
        )}

        {step === "phone" && (
          <PhoneStep phone={phone} setPhone={setPhone} loading={loading} onSubmit={requestOtp} />
        )}
        {step === "code" && (
          <OtpStep
            phone={phone} otp={otp}
            setOtp={(v) => { setOtp(v); setError(null); setResentMsg(false); }}
            loading={loading} onComplete={submitOtp}
            onBack={() => { setStep("phone"); setOtp(""); setError(null); }}
            onResent={() => { setOtp(""); setError(null); setResentMsg(true); setTimeout(() => setResentMsg(false), 3000); }}
          />
        )}
        {step === "register" && (
          <RegisterStep
            name={name} setName={setName} email={email} setEmail={setEmail}
            role={role} setRole={setRole} loading={loading} onSubmit={register}
          />
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
