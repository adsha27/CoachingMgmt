import Link from "next/link";
import type { Metadata } from "next";
import { ThemeToggle } from "./_components/ThemeToggle";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://novusclasses.in";

export const metadata: Metadata = {
  title: "Novus Classes — Book a Verified JEE & NEET Teacher",
  description:
    "Novus Classes lists real teachers with real results. Compare rank, price and reviews, then book your first session in under two minutes.",
  openGraph: {
    title: "Novus Classes — Book a Verified JEE & NEET Teacher",
    description: "Verified teachers only. Book one session first, no package lock-in.",
    url: BASE,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Novus Classes — JEE & NEET Coaching",
    description: "Verified teachers only. Book one session first, no package lock-in.",
  },
  alternates: { canonical: BASE },
};

const TEACHERS = [
  { initials: "RK", name: "Rajesh Kumar", sub: "Physics · JEE Advanced", rating: "4.9 ★" },
  { initials: "SP", name: "Sunita Patil", sub: "Biology · NEET", rating: "4.8 ★" },
  { initials: "AM", name: "Arun Mehta", sub: "Chemistry · JEE Mains", rating: "4.9 ★" },
];

const FAQS = [
  {
    q: "Is the teacher actually verified?",
    a: "Yes. Every teacher completes an identity and credential check before they can list a session. Look for the verified badge on their profile.",
  },
  {
    q: "What if the teacher isn't a good fit?",
    a: "Book one session first. There is no package to cancel and no refund process to fight.",
  },
  {
    q: "Can I switch teachers mid-course?",
    a: "Any time. Your subject and syllabus stay the same, your teacher does not have to.",
  },
  {
    q: "How fast can I book?",
    a: "Most students book their first session in under two minutes, right after signing up.",
  },
  {
    q: "Is pricing hidden until I sign up?",
    a: "No. Every listing shows the exact price per session before you book.",
  },
  {
    q: "Do sessions happen on this app?",
    a: "Sessions run on Google Meet. You get the link the moment you book.",
  },
];

const SEGMENTS = [
  {
    tag: "Repeaters",
    title: "Second or third attempt",
    body: "You need a teacher who has coached repeaters before and knows where students actually lose marks.",
  },
  {
    tag: "School + coaching",
    title: "Balancing both",
    body: "You need flexible timing that does not clash with school hours or homework load.",
  },
  {
    tag: "Parents",
    title: "Managing the search",
    body: "You are comparing teachers on your child's behalf and want verified credentials before you pay.",
  },
];

export default function HomePage() {
  return (
    <main className="marketing">
      <div className="wrap">
        <nav>
          <Link href="/" className="logo">
            <span className="logo-mark">N</span>
            Novus&nbsp;<span className="logo-accent">Classes</span>
          </Link>
          <div className="nav-links">
            <Link href="/browse">Browse</Link>
            <Link href="/login">Sign in</Link>
            <Link
              href="/login?next=/student/dashboard"
              className="btn btn-primary"
              style={{ fontSize: 13, padding: "9px 18px" }}
            >
              Get started
            </Link>
          </div>
        </nav>

        <section className="hero">
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-grid">
            <div>
              <div className="badge">Verified teachers only</div>
              <h1 className="hero-title">Book a verified JEE or NEET teacher today.</h1>
              <p className="hero-sub">
                Novus Classes lists real teachers with real results. Compare rank, price and reviews,
                then book your first session in under two minutes.
              </p>
              <div className="hero-actions">
                <Link href="/browse" className="btn btn-primary">Browse verified teachers</Link>
                <a href="#how" className="btn btn-secondary">See how it works</a>
              </div>
              <div className="hero-note">Book one session first · No package lock-in</div>
            </div>
            <div className="device-stack" aria-hidden="true">
              <div className="device-ghost" />
              <div className="device">
                <div className="device-bar">
                  <span className="device-dot" />
                  <span className="device-dot" />
                  <span className="device-dot" />
                </div>
                <div className="device-body">
                  {TEACHERS.map((t) => (
                    <div key={t.initials} className="device-row">
                      <div className="device-avatar">{t.initials}</div>
                      <div className="device-info">
                        <div className="device-name">{t.name}</div>
                        <div className="device-sub">{t.sub}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className="device-verified">VERIFIED</span>
                        <div className="device-price">{t.rating}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="proof-band">
        <div className="wrap">
          <div className="proof-grid">
            <div>
              <div className="proof-num">2 MIN</div>
              <div className="proof-label">average time from sign-up to a booked first session</div>
            </div>
            <div>
              <div className="proof-num">1</div>
              <div className="proof-label">session is all you commit to before deciding to continue, no package required</div>
            </div>
            <div>
              <div className="proof-num">100%</div>
              <div className="proof-label">of teachers identity and credential-verified before they can list</div>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap">
        <section id="how">
          <p className="section-label">Why not the usual way</p>
          <h2 className="section-title">Better than the usual way</h2>
          <ul className="compare-list">
            <li>Better than a <strong>WhatsApp forward</strong> from a neighbour, with no way to check if the teacher is any good.</li>
            <li>Better than an <strong>agent who takes a cut</strong> and disappears after the first payment clears.</li>
            <li>Better than a <strong>coaching centre package</strong> that locks you in for six months before you&apos;ve sat in a single class.</li>
          </ul>
        </section>
      </div>

      <div className="manifesto-band">
        <div className="wrap">
          <p className="manifesto-text">
            Every teacher here earned their spot.<br />
            We check who they are.<br />
            What they&apos;ve taught.<br />
            Whether students actually learn from them.<br />
            <strong>Before a single rupee changes hands.</strong>
          </p>
        </div>
      </div>

      <div className="wrap">
        <section>
          <p className="section-label">Real results</p>
          <h2 className="section-title">What families are saying</h2>
          <div className="testimonial-grid">
            <div className="testimonial-card c-emerald">
              <p className="testimonial-quote">
                &ldquo;My daughter switched to a verified NEET biology teacher after two tutors we found on
                WhatsApp didn&apos;t work out. Her mock scores went from 62 to 91 in four months.&rdquo;
              </p>
              <div className="testimonial-author">Meena R. · Parent, Pune</div>
            </div>
            <div className="testimonial-card c-gold">
              <p className="testimonial-quote">
                &ldquo;I book my physics sessions between school and dinner. Two minutes, no phone calls,
                no forms to fill.&rdquo;
              </p>
              <div className="testimonial-author">Aarav S. · Class 12, Lucknow</div>
            </div>
          </div>
        </section>

        <section>
          <p className="section-label">Questions</p>
          <h2 className="section-title">What students and parents actually ask</h2>
          <div className="faq-grid">
            {FAQS.map((f) => (
              <div key={f.q} className="faq-item">
                <p className="faq-q">{f.q}</p>
                <p className="faq-a">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="section-label">Who this is for</p>
          <h2 className="section-title">Who Novus Classes is for</h2>
          <div className="segment-grid">
            {SEGMENTS.map((s) => (
              <div key={s.tag} className="segment-card">
                <span className="segment-tag">{s.tag}</span>
                <p className="segment-title">{s.title}</p>
                <p className="segment-body">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer>
          <p>© 2026 Novus Classes · Verified JEE &amp; NEET teachers</p>
          <p>
            Are you a teacher?{" "}
            <Link href="/login?portal=teacher&next=/teacher/dashboard">Teacher login</Link>
          </p>
        </footer>
      </div>

      <ThemeToggle />
    </main>
  );
}
