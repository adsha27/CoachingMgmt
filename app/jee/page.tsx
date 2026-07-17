import type { Metadata } from "next";
import ExamLandingPage, { type ExamConfig } from "@/app/_components/ExamLandingPage";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://novusclasses.in";

export const metadata: Metadata = {
  title: "JEE Coaching Teachers Online | Novus Classes",
  description: "Find verified JEE Main and JEE Advanced coaching teachers. Physics, Chemistry, Mathematics. Group courses from ₹299/session. Book online.",
  openGraph: {
    title: "JEE Coaching Teachers Online | Novus Classes",
    description: "Verified JEE teachers. Group courses and 1-on-1 sessions. Book from your phone.",
    url: `${BASE}/jee`,
    type: "website",
  },
  twitter: { card: "summary", title: "JEE Coaching Online | Novus Classes" },
  alternates: { canonical: `${BASE}/jee` },
};

const JEE: ExamConfig = {
  examValues: ["JEE Main", "JEE Advanced", "JEE"],
  profileExams: ["JEE Main", "JEE Advanced"],
  jsonLdName: "JEE Coaching Teachers",
  jsonLdDesc: "Verified JEE Main and JEE Advanced coaching teachers on Novus Classes",
  badge: "JEE Main · JEE Advanced",
  h1: "JEE Coaching Teachers Online",
  heroDesc: "Verified Physics, Chemistry, and Maths teachers for JEE Main and Advanced. Group courses from ₹299/session. Book from your phone.",
  browseHref: "/browse?exam=JEE+Advanced",
  browseCta: "Browse all JEE teachers",
  emptyMsg: "No JEE teachers listed yet.",
  seoH2: "How to prepare for JEE online",
  seoPara1: "JEE Main and JEE Advanced require strong fundamentals in Physics, Chemistry, and Mathematics. Novus Classes connects students with verified teachers who specialize in JEE preparation. You can join affordable group courses to learn alongside peers, or book private 1-on-1 sessions for personalized doubt clearing.",
  seoPara2: "All teachers on Novus Classes are manually verified by our team before appearing on the platform. Sessions happen via Google Meet with automatic reminders sent 1 hour before.",
  theme: "indigo",
};

export default function JeeLandingPage() {
  return <ExamLandingPage config={JEE} />;
}
