import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "./_components/Toast";

export const metadata: Metadata = {
  title: {
    default: "EduConnect — JEE & NEET Coaching",
    template: "%s | EduConnect",
  },
  description: "Find verified JEE and NEET teachers. Book group courses or 1-on-1 sessions.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://educonnect.in"),
  openGraph: {
    siteName: "EduConnect",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    site: "@educonnectin",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
