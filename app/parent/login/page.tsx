import Link from "next/link";

// Parent access previously used phone-OTP, which has been removed. A token-based
// parent link (mirroring the existing teacher /schedule/[token] pattern) is the
// planned replacement — not built yet. Until then this entrance is disabled.
export default function ParentLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm bg-surface border border-line rounded-2xl p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-ink mb-2">Parent Access</h1>
        <p className="text-sm text-ink-soft mb-6">
          Parent sign-in is being upgraded and is temporarily unavailable. Please ask your
          child&apos;s teacher or our team for session updates in the meantime.
        </p>
        <Link href="/" className="text-sm font-semibold text-accent hover:text-accent-dark">← Back to home</Link>
      </div>
    </main>
  );
}
