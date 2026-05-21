## Context

Phase 1 ships a fully admin-controlled console: the operator schedules sessions, provisions Meet links, and teachers get a public token-gated schedule URL. Phase 2 adds authenticated portals for teachers and students without introducing passwords, which would require a forgotten-password flow and secret management.

Current constraints:
- Stack: Next.js 16 App Router, Prisma 6, PostgreSQL, Resend (email), Tailwind
- No external auth provider budget (Clerk, Auth0, etc.)
- No Twilio — all communication must go through email
- Phase 1 API routes must not break

## Goals / Non-Goals

**Goals:**
- Email OTP login for any registered user — stateless verification, no password storage
- Authenticated teacher dashboard that beats the WhatsApp UX (better than public token page)
- Authenticated student dashboard showing enrolled sessions
- Teacher availability slot proposal so admin can schedule around real availability
- 24-hour session reminder emails (automated, not manual)

**Non-Goals:**
- SMS OTP (requires Twilio; deferred to Phase 3)
- Student self-booking (browsing and booking sessions autonomously; Phase 3)
- Role-based admin auth (admin is implicitly anyone with DB access for now; Phase 3)
- OAuth / social login
- Password reset flow (no passwords exist)

## Decisions

### D1 — Email OTP, not magic link

**Chosen:** 6-digit numeric code, 10-minute TTL, single-use.

**Alternatives:**
- Magic link (email containing a URL token): requires the URL to survive email client link rewriting (Outlook, Gmail) which strips query params. Codes don't have this problem.
- SMS OTP: needs Twilio; out of scope.

**Rationale:** A numeric code is copy-paste-safe across email clients, works on mobile without leaving the email app, and has no link-rewriting risk. Code is stored as a bcrypt hash in `otp_codes` — raw code never persisted.

---

### D2 — httpOnly session cookie, server-issued JWT-like token

**Chosen:** Server generates a `sessionId` (cuid), stores `{ sessionId, userId, expiresAt }` in `user_sessions` table, sets an httpOnly `sid` cookie (14-day TTL, SameSite=Lax).

**Alternatives:**
- Stateless JWT: no DB lookup per request, but can't revoke individual sessions (admin deactivates a user mid-session and the JWT is still valid until expiry).
- Iron-session (encrypted cookie): no DB needed, but same revocation problem.

**Rationale:** We need instant revocation (admin can deactivate a user). The extra DB lookup per authenticated request is negligible at this scale. `user_sessions` is indexed on `sessionId`.

---

### D3 — Middleware-based route protection (Next.js `middleware.ts`)

**Chosen:** Next.js Edge Middleware at `middleware.ts` protects `/teacher/*` and `/student/*`. Reads `sid` cookie, validates against DB via `lib/auth.ts`.

**Alternatives:**
- Per-page `getServerSideProps`-style checks: repetitive, easy to miss a page.
- Higher-order component: only works client-side.

**Rationale:** Middleware runs before page rendering at the edge, centralises auth, and enables instant redirect to `/login` on missing/expired session. One place to update when adding new protected routes.

---

### D4 — OTP rate limiting via DB counter, not Redis

**Chosen:** Track `requestCount` and `lastRequestAt` on `otp_codes` per email. Block if >5 requests in 15 minutes.

**Alternatives:**
- Redis rate limiter: requires new dependency and infrastructure.
- No rate limiting: OTP endpoint is a spam/abuse vector.

**Rationale:** At Phase 2 scale (tens of teachers/students) a DB-backed counter is sufficient. No new infrastructure.

---

### D5 — Availability slots: teacher proposes, admin schedules

**Chosen:** `teacher_availability` stores open time windows (start, end, note). Admin sees proposed slots as a reference when scheduling sessions in `/admin/sessions/new`. No auto-booking.

**Alternatives:**
- Full slot locking (session can only be scheduled into an availability window): adds complexity, breaks the admin's current scheduling freedom.
- No availability feature: leaves admin scheduling blind to teacher conflicts.

**Rationale:** Phase 2 is about reducing friction, not enforcing constraints. Slots are advisory. Teacher retention is the named risk — giving teachers a way to communicate availability increases their engagement with the platform.

---

### D6 — Session reminders via Next.js cron route + Vercel Cron (or manual trigger)

**Chosen:** `GET /api/cron/session-reminders` with `Authorization: Bearer $CRON_SECRET`. Queries sessions starting in 23–25 hours, sends reminder email if `reminderSentAt` is null. Designed for Vercel Cron (`vercel.json`) but can be triggered manually or via any HTTP scheduler.

**Alternatives:**
- Node cron in a long-running process: doesn't work on serverless.
- Separate worker service: premature at Phase 2 scale.

**Rationale:** Serverless-compatible, zero new dependencies, testable with a curl.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| OTP email goes to spam → teacher/student can't log in | Use Resend sender domain with SPF/DKIM; add plain-text fallback; admin can see email delivery status |
| Session cookie stolen (XSS) | httpOnly + SameSite=Lax mitigates; CSP headers recommended |
| `user_sessions` table grows unboundedly | Nightly cleanup of expired sessions via the cron route |
| Teacher updates availability mid-session-period | Slots are advisory; admin is unblocked regardless |
| Cron job fails silently | `reminderSentAt` stays null; next run retries. Log errors to console; admin can rerun manually |

## Migration Plan

1. Run `prisma migrate dev` to add `otp_codes`, `user_sessions`, `teacher_availability`, and `sessions.reminderSentAt`
2. Deploy new routes and pages (additive — no existing routes change)
3. Add `CRON_SECRET` to `.env.local` / production env
4. Configure Vercel Cron (or equivalent) to call `/api/cron/session-reminders` nightly at 08:00 IST
5. Existing Phase 1 admin pages and `/schedule/[token]` continue working unchanged

**Rollback:** Remove `middleware.ts` and the new routes/pages. DB migration is additive (no columns removed from existing tables).

## Open Questions

- Should the login page auto-detect role (teacher vs student) from the email, or should users pick a role? → **Decision: auto-detect from DB; if email matches a teacher, show teacher portal; if student, show student portal.**
- Should teachers be able to delete their availability slots? → **Yes, simple delete. Admin is notified via the slot list.**
