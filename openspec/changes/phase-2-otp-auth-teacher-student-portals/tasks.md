## 1. Database Schema

- [ ] 1.1 Add `otp_codes` table to `prisma/schema.prisma` (id, email, codeHash, expiresAt, usedAt, requestCount, windowStart)
- [ ] 1.2 Add `user_sessions` table (id, sessionId String unique, userId, expiresAt, createdAt)
- [ ] 1.3 Add `teacher_availability` table (id, teacherId, startTime, endTime, note, createdAt)
- [ ] 1.4 Add `reminderSentAt DateTime?` column to `Session` model
- [ ] 1.5 Run `npx prisma migrate dev --name phase-2-auth-portals`

## 2. Auth Library

- [ ] 2.1 Create `lib/otp.ts` — `generateCode()` returns 6-digit string; `hashCode(code)` bcrypt hash; `verifyCode(code, hash)` bcrypt compare
- [ ] 2.2 Create `lib/auth.ts` — `createSession(userId)` inserts `user_sessions` row, returns sessionId; `getSession(sid)` looks up + checks expiry + returns user; `deleteSession(sid)` deletes row
- [ ] 2.3 Create `lib/emails/otp-code.tsx` — React Email template with the OTP code prominently displayed, 10-minute expiry note
- [ ] 2.4 Create `lib/emails/session-reminder.tsx` — React Email template with session subject, teacher name, date/time, duration, Meet link

## 3. Auth API Routes

- [ ] 3.1 Create `app/api/auth/otp/request/route.ts` — POST: validate email exists in DB, check rate limit (5 per 15 min), generate+hash code, send OTP email via Resend
- [ ] 3.2 Create `app/api/auth/otp/verify/route.ts` — POST: find latest valid code for email, bcrypt compare, mark usedAt, call createSession, set httpOnly `sid` cookie, redirect by role
- [ ] 3.3 Create `app/api/auth/logout/route.ts` — POST: read sid cookie, deleteSession, clear cookie, redirect to /login
- [ ] 3.4 Create `app/api/me/route.ts` — GET: read sid cookie, getSession, return `{ id, name, email, role }` or 401

## 4. Middleware

- [ ] 4.1 Create `middleware.ts` at project root — protect `/teacher/*` and `/student/*`; read `sid` cookie; call `getSession`; redirect to `/login?next=[path]` if missing/expired; allow through if valid

## 5. Login Page

- [ ] 5.1 Create `app/login/page.tsx` — client component with email input step and code input step (two-step form)
- [ ] 5.2 Wire up step 1: POST to `/api/auth/otp/request`, show success message + code input
- [ ] 5.3 Wire up step 2: POST to `/api/auth/otp/verify`, handle redirect on success, show errors on failure

## 6. Teacher Portal

- [ ] 6.1 Create `app/teacher/dashboard/page.tsx` — server component; call getSession from cookie header; fetch upcoming sessions for teacherId; render session cards with Meet link
- [ ] 6.2 Create `app/teacher/sessions/[id]/page.tsx` — session detail with student list (name + email), date/time, Meet button; 404 if session belongs to another teacher
- [ ] 6.3 Add past sessions tab/section to dashboard (sessions where scheduledDate < now or status != SCHEDULED)
- [ ] 6.4 Add logout link in teacher dashboard header → POST `/api/auth/logout`
- [ ] 6.5 Add availability section to `app/teacher/dashboard/page.tsx` — list upcoming slots; inline add-slot form; delete button per slot

## 7. Availability API

- [ ] 7.1 Create `app/api/teacher/availability/route.ts` — GET: list slots for authenticated teacher; POST: create slot with validation (endTime > startTime)
- [ ] 7.2 Create `app/api/teacher/availability/[id]/route.ts` — DELETE: verify slot.teacherId === session.userId, delete row; return 403 if mismatch

## 8. Student Portal

- [ ] 8.1 Create `app/student/dashboard/page.tsx` — server component; fetch upcoming enrolled sessions for studentId via `SessionStudent`; render cards with teacher name and Meet link
- [ ] 8.2 Create `app/student/sessions/[id]/page.tsx` — session detail for enrolled student; 404 if not enrolled
- [ ] 8.3 Add past sessions section to student dashboard
- [ ] 8.4 Add logout link in student dashboard header

## 9. Admin Enhancements

- [ ] 9.1 Update `app/admin/sessions/new/NewSessionForm.tsx` — fetch and display teacher's availability slots when a teacher is selected (read-only reference panel)
- [ ] 9.2 Add `app/api/teacher/availability/[teacherId]/route.ts` — GET: list availability slots for a given teacherId (admin use, no auth required for now)

## 10. Session Reminders Cron

- [ ] 10.1 Create `app/api/cron/session-reminders/route.ts` — GET: verify `Authorization: Bearer $CRON_SECRET`; query sessions with `scheduledDate` in [now+23h, now+25h] and `reminderSentAt IS NULL` and status `SCHEDULED`; send reminder email; update `reminderSentAt`
- [ ] 10.2 Add `CRON_SECRET` to `.env.local.example`
- [ ] 10.3 Create `vercel.json` with cron entry: `GET /api/cron/session-reminders` at `0 2 * * *` (02:00 UTC = 07:30 IST)

## 11. Tests

- [ ] 11.1 Add `tests/auth.test.ts` — OTP request (valid email, unknown email, rate limit), OTP verify (valid, expired, already-used, wrong code), logout
- [ ] 11.2 Add `tests/availability.test.ts` — create slot (valid, end-before-start), list, delete (own, foreign → 403)
- [ ] 11.3 Add `tests/reminders.test.ts` — cron sends reminder for in-window sessions, skips already-reminded, skips cancelled, returns 401 without CRON_SECRET

## 12. Cleanup & Commit

- [ ] 12.1 Run `npx tsc --noEmit` — fix any type errors
- [ ] 12.2 Run `npm test` against real local Postgres — all tests green
- [ ] 12.3 Commit with message `feat: Phase 2 — OTP auth, teacher/student portals, availability slots, reminders`
