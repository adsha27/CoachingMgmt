import bcryptjs from "bcryptjs";
import crypto from "crypto";

export function generateCode(): string {
  return crypto.randomInt(100_000, 1_000_000).toString();
}

export async function hashCode(code: string): Promise<string> {
  return bcryptjs.hash(code, 10);
}

export async function verifyCode(code: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(code, hash);
}

export const OTP_TTL_MINUTES = 10;
export const OTP_RATE_LIMIT = 3;        // max requests per hour per phone (spec)
export const OTP_WINDOW_MINUTES = 60;   // 1-hour window

// Normalise Indian phone numbers → 10-digit string (no country code).
// Accepts: "9876543210", "+919876543210", "919876543210".
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return null;
}

// Send OTP via MSG91 (AUTH_MODE=phone) or Resend email (AUTH_MODE=email fallback).
export async function sendOtp(phone: string, code: string, email?: string): Promise<void> {
  const mode = process.env.AUTH_MODE ?? "phone";

  if (mode === "email") {
    if (!email) return; // no email on file → silent; dev uses fixed code
    const { sendEmail } = await import("@/lib/email");
    const { render } = await import("@react-email/render");
    const React = (await import("react")).default;
    const { OtpCodeEmail, otpCodeText } = await import("@/lib/emails/otp-code");
    const html = await render(React.createElement(OtpCodeEmail, { code, expiresMinutes: OTP_TTL_MINUTES }));
    await sendEmail({ to: email, subject: "Your login code", html, text: otpCodeText(code, OTP_TTL_MINUTES) });
    return;
  }

  // Phone mode — MSG91
  const apiKey = process.env.MSG91_API_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  if (!apiKey || !templateId) {
    console.warn("MSG91_API_KEY / MSG91_TEMPLATE_ID not set — OTP not sent");
    return;
  }
  const mobile = `91${phone}`;
  const res = await fetch("https://control.msg91.com/api/v5/otp", {
    method: "POST",
    headers: { "Content-Type": "application/json", authkey: apiKey },
    body: JSON.stringify({ template_id: templateId, mobile, otp: code }),
  });
  if (!res.ok) {
    console.error("MSG91 OTP send failed:", await res.text());
  }
}
