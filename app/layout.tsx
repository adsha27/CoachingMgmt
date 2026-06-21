import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "./_components/Toast";

export const metadata: Metadata = {
  title: "EduConnect — JEE & NEET Coaching",
  description: "Find verified JEE and NEET teachers. Book group courses or 1-on-1 sessions.",
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
