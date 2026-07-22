## 1. Database
- [ ] 1.1 Create Neon `staging` branch from `production`
- [ ] 1.2 Confirm migration history is intact (`prisma migrate status` → up to date)

## 2. Git + Vercel
- [ ] 2.1 Create long-lived `staging` git branch from `main`
- [ ] 2.2 Point Preview `DATABASE_URL` at the staging Neon branch
- [ ] 2.3 Add SMTP_USER / SMTP_PASS / EMAIL_FROM to Preview
- [ ] 2.4 Add NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_BASE_URL (staging URL) to Preview
- [ ] 2.5 Add AUTH_MODE / DEMO_MODE / CRON_SECRET / REGISTRATION_TOKEN_SECRET to Preview
- [ ] 2.6 Remove dead RESEND_API_KEY from both environments

## 3. Guardrails
- [ ] 3.1 `[STAGING]` subject prefix in lib/email.ts, gated on an env flag
- [ ] 3.2 Verify production email subjects are unaffected

## 4. Seed
- [ ] 4.1 `scripts/seed-staging.mjs`: admin + teacher + student with fixed credentials
- [ ] 4.2 Seed a published course with a meeting link and a pending application
- [ ] 4.3 Make it idempotent so it can be re-run to reset staging

## 5. Verify
- [ ] 5.1 Deploy `staging` branch, confirm it builds and migrates
- [ ] 5.2 Run the full end-to-end flow against the staging URL
- [ ] 5.3 Confirm staging writes to the staging DB and never to production
- [ ] 5.4 Hand the operator a credentials card

## 6. Operator-only (cannot be done from here)
- [ ] 6.1 Attach `staging.novusclasses.in` in Vercel + the matching Cloudflare DNS record
