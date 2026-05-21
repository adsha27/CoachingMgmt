## Why

Phase 1 gave the admin full control to schedule sessions and send Meet links. However, every teacher still checks WhatsApp for updates instead of the platform — reducing admin burden requires teachers to actively use their portal. Students have no visibility into their sessions without WhatsApp. Phase 2 closes both gaps: OTP login (no passwords) lets teachers and students use a real authenticated portal, and gives each group self-service visibility into their own schedule.

## What Changes

- **OTP authentication** via email: request a one-time code, verify it, receive a session cookie — no passwords anywhere.
- **Teacher portal** (authenticated): teachers log in with their registered email, see upcoming sessions, view session details with student list and Meet link, and propose availability slots for the admin to work from.
- **Student portal** (authenticated): students log in with their registered email, see their enrolled sessions with Meet links and teacher name — a clean alternative to WhatsApp forwards.
- **Session reminder emails**: 24-hour pre-session reminder automatically sent to teacher + enrolled students (cron job or scheduled task).
- **Admin user management**: admin can activate/deactivate teacher and student accounts from the existing admin console.
- Existing public `/schedule/[token]` page remains unchanged for teachers who prefer the no-login URL.

## Capabilities

### New Capabilities

- `otp-auth`: Email OTP flow — request code, verify code, issue httpOnly session cookie. Works for any registered user (teacher or student). Logout clears cookie.
- `teacher-portal`: Authenticated teacher dashboard at `/teacher/dashboard` — upcoming sessions, session detail (students, Meet link), availability slot proposal form.
- `student-portal`: Authenticated student dashboard at `/student/dashboard` — enrolled upcoming sessions, session detail (teacher, Meet link, date/time).
- `availability-slots`: Teachers propose available time windows. Admin sees proposed slots when scheduling sessions. Stored in `teacher_availability` table.
- `session-reminders`: Nightly job sends 24-hour-ahead reminder email to teacher + students for each upcoming session. Tracks `reminderSentAt` on the session row.

### Modified Capabilities

- `session-management`: Add `reminderSentAt` column to sessions. No spec-level behavior change to creation/cancellation.

## Impact

- **New DB tables**: `otp_codes` (token, email, expiresAt, usedAt), `user_sessions` (sessionId, userId, expiresAt), `teacher_availability` (teacherId, startTime, endTime, note)
- **New column**: `sessions.reminderSentAt DateTime?`
- **New API routes**: `POST /api/auth/otp/request`, `POST /api/auth/otp/verify`, `POST /api/auth/logout`, `GET /api/me`
- **New pages**: `/login`, `/teacher/dashboard`, `/student/dashboard`
- **New lib**: `lib/auth.ts` (session cookie management), `lib/otp.ts` (code generation + verification)
- **Middleware**: `middleware.ts` protecting `/teacher/*` and `/student/*` routes
- **Dependencies**: none new — OTP codes sent via Resend (already installed), `crypto` (Node built-in) for secure random code generation
- **No breaking changes** to existing Phase 1 routes or admin pages
