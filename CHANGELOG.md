# Changelog

## [0.1.0] — 2026-05-21

Initial release of CoachingMgmt — a JEE/NEET coaching ops platform for managing teachers, students, and tutoring sessions.

### Features

- **OTP authentication** — Email-based 6-digit OTP login (10-min TTL, bcrypt-hashed), rate-limited to 5 requests per 15 minutes, with brute-force lockout after 5 wrong attempts
- **Role-based portals** — Separate dashboards for Admin, Teacher, and Student roles; session cookie (httpOnly, SameSite=lax, secure in production) with 14-day TTL
- **Admin console** — Schedule sessions, manage teachers and students, mark sessions complete, cancel with reason + cancellation email
- **Teacher portal** — Token-gated schedule page showing upcoming sessions with Meet links; availability slot management
- **Student portal** — Dashboard and per-session detail view for enrolled sessions
- **Session reminders** — Cron endpoint sends email reminders 23–25 hours before each scheduled session
- **Google Meet integration** — Auto-creates Meet links and Calendar events when scheduling sessions
- **Security hardening** — Auth guard on all admin routes (middleware + API), PII limited to admins only, HTTP security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- **Demo seed** — `npm run db:demo` populates Priya Sharma, Arjun Mehta, Kavya Nair with an upcoming and past session for demos

### Technical

- Next.js 16 App Router, Prisma 6 + PostgreSQL, Resend for email, bcryptjs
- Vitest unit tests (34 passing) hitting a real test database; Playwright e2e suite
- GitHub Actions CI: typecheck → prisma validate → unit tests → e2e → build

[0.1.0]: https://github.com/adsha27/CoachingMgmt/commits/main
