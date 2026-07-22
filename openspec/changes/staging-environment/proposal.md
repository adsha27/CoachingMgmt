## Why

There is no environment the operator can safely test on. Everything so far has been verified either on a local dev server or directly against production — including a live end-to-end run that created real users, a real course and a real enrolment email, which then had to be deleted from the production database by hand. That is not repeatable and it is not safe.

Vercel's Preview environment exists but is **half-configured**, so it would actively mislead anyone testing on it:

- `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` are **Production-only** → email silently fails on Preview, so the flow that was just fixed appears broken.
- `NEXT_PUBLIC_APP_URL` is **Production-only** → a password-reset requested on staging emails a link pointing at **production**.
- `AUTH_MODE` and `CRON_SECRET` are Production-only → auth and cron behave differently from production.
- `RESEND_API_KEY` is still set on Preview + Production but Resend was replaced by Google SMTP — dead configuration.

The existing Neon `dev` branch cannot serve as staging: it is shared with gbrain (~57 unrelated tables), which makes `prisma migrate dev` attempt a destructive reset, so every migration has had to be hand-applied.

## What Changes

- New Neon branch `staging`, branched from `production` so it carries production-shaped schema and migration history (unlike `dev`).
- New long-lived git branch `staging`; Vercel Preview deploys it at a stable URL.
- Vercel **Preview** environment gets the full variable set, with staging-specific `DATABASE_URL` and `NEXT_PUBLIC_APP_URL`, so staging behaves like production instead of silently diverging.
- Staging email sends for real but every subject is prefixed `[STAGING]`, so a message that escapes to a real inbox is unmistakable.
- `scripts/seed-staging.mjs` creates fixed, known-credential accounts (admin / teacher / student) plus a published course with a meeting link, so the operator can log in and exercise the full flow immediately, and can reset to a clean state at any time.
- Dead `RESEND_API_KEY` removed from both environments.

## Impact

- Affected: Vercel project configuration, Neon branches, `lib/email.ts` (subject prefix), new seed script, `README`/env example.
- No production runtime behaviour changes. The subject prefix is gated on an env flag that is only set on staging.
- Operator gains a URL and credentials to test against without touching real user data.
