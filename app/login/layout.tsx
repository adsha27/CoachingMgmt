import type { Metadata } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://educonnect.in";

export const metadata: Metadata = {
  title: "Sign in | EduConnect",
  description: "Sign in or create your account on EduConnect with your email and password.",
  openGraph: {
    title: "Sign in | EduConnect",
    url: `${BASE}/login`,
    type: "website",
  },
  robots: { index: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
