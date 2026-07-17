import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./_components/Toast";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Novus Classes — JEE & NEET Coaching",
    template: "%s | Novus Classes",
  },
  description:
    "Book a verified JEE or NEET teacher today. Compare rank, price and reviews, then book your first session in under two minutes.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://novusclasses.in"),
  openGraph: {
    siteName: "Novus Classes",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    site: "@novusclasses",
  },
};

// Apply the saved theme before first paint so dark mode never flashes light.
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
