import type { Metadata } from "next";
import ExamLandingPage, { type ExamConfig } from "@/app/_components/ExamLandingPage";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://educonnect.in";

export const metadata: Metadata = {
  title: "NEET Coaching Teachers Online | EduConnect",
  description: "Find verified NEET UG coaching teachers. Biology, Chemistry, Physics. Group courses from ₹299/session. Book online from your phone.",
  openGraph: {
    title: "NEET Coaching Teachers Online | EduConnect",
    description: "Verified NEET teachers. Group courses and 1-on-1 sessions. Book from your phone.",
    url: `${BASE}/neet`,
    type: "website",
  },
  twitter: { card: "summary", title: "NEET Coaching Online | EduConnect" },
  alternates: { canonical: `${BASE}/neet` },
};

const NEET: ExamConfig = {
  examValues: ["NEET", "NEET UG"],
  profileExams: ["NEET", "NEET UG"],
  jsonLdName: "NEET Coaching Teachers",
  jsonLdDesc: "Verified NEET UG coaching teachers on EduConnect",
  badge: "NEET UG · Medical entrance",
  h1: "NEET Coaching Teachers Online",
  heroDesc: "Verified Biology, Chemistry, and Physics teachers for NEET UG. Group courses from ₹299/session. Book from your phone.",
  browseHref: "/browse?exam=NEET",
  browseCta: "Browse all NEET teachers",
  emptyMsg: "No NEET teachers listed yet.",
  seoH2: "How to prepare for NEET online",
  seoPara1: "NEET UG requires deep conceptual understanding of Biology, Chemistry, and Physics. EduConnect connects aspiring medical students with verified teachers who specialize in NEET preparation. Join group batches to learn with peers, or book dedicated 1-on-1 sessions for focused doubt clearing.",
  seoPara2: "All teachers are manually reviewed by the EduConnect team. Sessions happen via Google Meet with automatic reminders sent 1 hour before your class.",
  theme: "emerald",
};

export default function NeetLandingPage() {
  return <ExamLandingPage config={NEET} />;
}
