## 1. Database
- [x] 1.1 Create Neon `staging` branch from `production`
- [x] 1.2 Confirm migration history is intact (`prisma migrate status` → up to date)

## 2. Git + Vercel
- [x] 2.1 Create long-lived `staging` git branch from `main`
- [x] 2.2 Point Preview `DATABASE_URL` at the staging Neon branch
- [x] 2.3 Add SMTP_USER / SMTP_PASS / EMAIL_FROM to Preview
- [x] 2.4 Add NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_BASE_URL (staging URL) to Preview
- [x] 2.5 Add AUTH_MODE / DEMO_MODE / CRON_SECRET / REGISTRATION_TOKEN_SECRET to Preview
- [x] 2.6 Remove dead RESEND_API_KEY from both environments

## 3. Guardrails
- [x] 3.1 `[STAGING]` subject prefix in lib/email.ts, gated on an env flag
- [x] 3.2 Verify production email subjects are unaffected

## 4. Seed
- [x] 4.1 `scripts/seed-staging.mjs`: admin + teacher + student with fixed credentials
- [x] 4.2 Seed a published course with a meeting link and a pending application
- [x] 4.3 Make it idempotent so it can be re-run to reset staging

## 5. Verify
- [x] 5.1 Deploy `staging` branch, confirm it builds and migrates
- [x] 5.2 Run the full end-to-end flow against the staging URL
- [x] 5.3 Confirm staging writes to the staging DB and never to production
- [x] 5.4 Hand the operator a credentials card

## 6. Operator-only (cannot be done from here)
- [ ] 6.1 Attach `staging.novusclasses.in` in Vercel + the matching Cloudflare DNS record

## Notes

- Vercel Preview requires the git branch as a positional argument
  (`vercel env add NAME preview staging --value V --yes`); without it the CLI
  prompts and the add silently no-ops in a non-interactive shell.
- Preview deployments sit behind Vercel SSO (`ssoProtection:
  all_except_custom_domains`). A protection-bypass secret was generated so the
  operator and automated tests can reach staging today. **Attaching
  `staging.novusclasses.in` removes the need for it entirely**, since custom
  domains are excluded from SSO — that is task 6.1 and needs Cloudflare DNS.
- Staging has its own `CRON_SECRET` and `REGISTRATION_TOKEN_SECRET`; production
  secrets are deliberately not shared across environments.
