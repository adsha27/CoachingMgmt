## Context

Current system is a closed admin-ops tool: admin schedules sessions, teachers get a token URL, students are enrolled by admin. Stack is Next.js 14 App Router, Prisma, PostgreSQL, Resend (email), Google Calendar API. Auth is email OTP with server-side sessions. ~55 files total, small footprint.

New system is a self-service marketplace. Teachers create and publish courses. Students browse and book. Admin shifts to gatekeeper + oversight. Auth changes from email to phone OTP (MSG91). Most existing code is reused, redirected, or lightly extended — not thrown out.

## Goals / Non-Goals

**Goals:**
- Phone OTP auth (MSG91) replacing email OTP
- Public teacher/course browse (no login)
- Teacher guided profile wizard + verification flow
- Group course + 1-on-1 package creation by teachers
- Self-service booking by students
- Rolling 1-on-1 scheduling via slot proposals
- Google Meet auto-provisioning on session creation (existing `lib/calendar.ts`)
- Per-session feedback, topic requests, parent access, teacher invite links
- Admin verification queue + oversight dashboard

**Non-Goals:**
- Payments (deferred — no Razorpay yet)
- Batch messaging / material sharing
- Cancellation/refund policy enforcement
- Session expiry for unused 1-on-1 sessions
- Testing/revision system
- Course-level aggregated reviews (built later on top of per-session feedback)
- Search engine (under 20 teachers at launch — filter + sort is enough)

## Decisions

### D1: Phone OTP via MSG91, not email OTP

Current system uses email OTP via Resend. Spec requires phone OTP for auth (₹0.15-0.20/SMS). `lib/otp.ts` currently hashes a 6-digit code and stores it against an email — swap `email` field for `phone` in `otp_codes` table and replace the Resend delivery call with a MSG91 HTTP POST. All other OTP logic (rate limiting, bcrypt compare, lockout after 5 failures, 3/hour cap) stays identical.

Alternative: keep email OTP and add phone as second factor. Rejected — spec says "one phone = one account", phone is the primary identifier.

### D2: Keep `UserSession` table, add `parentStudentId` column for scoped parent sessions

Parent access needs a read-only scoped JWT. Rather than a separate table, add `parentStudentId Int?` to `user_sessions`. When set, middleware treats the session as parent-scoped: read-only, only student data for that `parentStudentId` is visible. Parent verifies their own phone OTP → session created with `parentStudentId` set to the linked student's id.

Alternative: separate `parent_sessions` table. Rejected — adds a join everywhere middleware checks auth. Column on existing table is simpler.

### D3: `GroupSession` is a separate table, not reusing `Session`

Current `Session` model is admin-created, teacher-linked, has `students[]` via junction. The new `GroupSession` belongs to a `GroupCourse`, is auto-generated at course creation, and has `meetLink` + `calendarEventId`. `Session` (old model) gets renamed to keep existing 1-on-1 session records during migration, then deprecated. New `sessions` table serves both group and 1-on-1 — keyed by `bookingId`, not `teacherId` directly.

Unified `sessions` table (one table for both types) chosen over separate `group_sessions` / `one_on_one_sessions`. Simpler queries for "all upcoming sessions for student X". `bookingId` FK determines context.

### D4: Teacher availability as weekly grid, not datetime ranges

Current `TeacherAvailability` stores `startTime DateTime` / `endTime DateTime` (specific slots). New spec: `day_of_week (MON-SUN)` + `start_time TIME` + `end_time TIME` + `is_recurring BOOLEAN` + `specific_date DATE?` + `status AVAILABLE/BLOCKED`. Migration drops existing rows (none in production for real users yet). Teacher sets availability once as a weekly template; one-off overrides use `specific_date` with `is_recurring = false`.

### D5: `priceINR` stored as integer rupees, not paise

Current schema stores paise (multiply by 100 for Razorpay). Since payments are deferred, store as rupees (integer). When Razorpay is added, multiply at payment call time. Simpler display logic.

### D6: MSG91 integration via raw HTTP, no SDK

MSG91 has an official Node SDK but it's poorly maintained. Use `fetch` to `https://control.msg91.com/api/v5/otp` directly. Keeps dependencies minimal. Template ID stored in env var.

### D7: No registration page — phone OTP flow IS registration

If a phone number doesn't exist in `users` on first OTP verify, prompt for name + email + role selection inline. No separate `/register` page. This is the standard "login or register" OTP pattern. Removes `/register/student` and `/register/teacher` routes entirely.

### D8: Invite links use short codes stored in DB, not signed JWTs

`invite_links` table: `code VARCHAR(12) UNIQUE`, `courseId`, `courseType`, `teacherId`, `expiresAt`, `usesCount`. Student clicks `/invite/[code]` → server looks up code → if valid, after auth routes to booking confirmation for that course. No JWT signing needed — the code is the secret.

### D9: Admin no longer creates sessions

`/admin/sessions/new` page and `POST /api/sessions` route are deleted. Admin's job is verification + oversight. Sessions are created by: group course creation (all sessions upfront), or slot proposal confirmation (1-on-1). This is the biggest behavioral shift.

## Risks / Trade-offs

- **MSG91 delivery failure** → OTP not received, user locked out. Mitigation: retry UI after 60s, show support contact if 3 attempts fail. Add `otp_delivery_status` log for debugging.
- **Google Calendar API quota** → Meet link creation fails at scale. Mitigation: at <50 concurrent bookings this won't hit quota. Existing `lib/calendar.ts` already handles this. Add error logging and fallback message ("Meet link will be emailed shortly").
- **TeacherAvailability migration** → existing rows are datetime-based, incompatible. Mitigation: drop existing rows in migration SQL. No real teacher data lost (test data only at this stage).
- **Parent OTP on wrong phone** → parent verifies, gets scoped session for wrong student. Mitigation: parent_access row requires prior student authorization + matching phone. Server validates both before creating session.
- **Polymorphic booking FK** → `bookings.course_id` + `bookings.course_type` vs two nullable columns. We use two nullable FK columns (`groupCourseId`, `oneOnOnePackageId`) — exactly one non-null, enforced at app layer. Simpler DB-level FK constraints than a polymorphic pattern.

## Migration Plan

1. Run migration SQL: drops `teacher_tokens`, alters `teacher_profiles`, `teacher_availability`, `group_courses`, `one_on_one_packages`, `bookings`, `sessions`. Creates new tables.
2. `npx prisma generate` → regenerate client.
3. Delete dead routes + pages (list in tasks.md).
4. Implement new capabilities in order defined by tasks.md.
5. No rollback needed — no live user data that matters at this stage.

## Open Questions

- MSG91 account setup: template ID and sender ID must be pre-approved by MSG91 (DLT compliance in India). Need to verify these are registered before phone OTP can go live. Fallback: keep email OTP temporarily behind a feature flag env var `AUTH_MODE=email|phone`.
- Demo video: stored as YouTube/Vimeo URL in `demo_video_link`. Embedding on landing page requires checking YouTube iframe embed permissions. No self-hosted video.
