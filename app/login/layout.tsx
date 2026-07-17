import type { Metadata } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://novusclasses.in";

export const metadata: Metadata = {
  title: "Sign in | Novus Classes",
  description: "Sign in or create your account on Novus Classes with your email and password.",
  openGraph: {
    title: "Sign in | Novus Classes",
    url: `${BASE}/login`,
    type: "website",
  },
  robots: { index: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
