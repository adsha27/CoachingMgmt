## Why

The platform currently handles admin-scheduled sessions for a closed cohort — no public browsing, no self-service booking, no teacher-created courses. To grow beyond the founding students, it needs to become a marketplace: teachers publish courses, students discover and book them, and the admin role shrinks to verification and oversight.

## What Changes

- **BREAKING**: Auth switches from email OTP to **phone OTP** (MSG91). One phone = one account with one role. Existing email-OTP flow is removed.
- **BREAKING**: `TeacherProfile` gains required fields (photo, qualifications, target_exams, demo_video_link, social_media_links). Existing profiles are incomplete and must be migrated.
- **BREAKING**: `Session` is no longer admin-created. Sessions are generated automatically on booking (group) or scheduling agreement (1-on-1). Admin no longer creates sessions.
- **BREAKING**: `GroupCourse` grows `total_sessions`, `session_duration_minutes`, `enrolled_count`, `start_date`, `target_exam`. All sessions predefined at creation.
- **BREAKING**: `TeacherAvailability` changes from datetime ranges to `day_of_week` + `start_time` + `end_time` weekly grid with recurring/specific-date and AVAILABLE/BLOCKED status.
- Public landing page: browse 10-20 verified teachers and demo videos without login.
- Teacher profile creation becomes a guided multi-step wizard.
- Student self-service booking for group courses and 1-on-1 packages.
- Rolling 1-on-1 session scheduling via slot proposals (student proposes → teacher confirms).
- Per-session feedback (rating + comment) submitted by student after session completes.
- Topic demand requests: students signal what they want taught; teachers see aggregated demand.
- Parent read-only access: authorized through student account, phone OTP, scoped JWT.
- Teacher invite links: teacher generates a code for a course; student clicks → auto-enroll.
- Admin dashboard shifts from session creation to verification queue + oversight CRUD.
- Teacher cancellation requires admin approval; students notified on approval.

## Capabilities

### New Capabilities

- `phone-otp-auth`: Phone-based OTP auth via MSG91. Rate limits, lockout, parent scoped sessions.
- `teacher-profile-wizard`: Guided multi-step profile creation (basic → qualifications → demo → social → submit). Verification flow with PENDING/VERIFIED/REJECTED/MORE_INFO_REQUESTED states.
- `public-browse`: Unauthenticated listing of verified teachers and their active courses. Filter by subject, target_exam, course type. Sort by price, start_date.
- `group-course-management`: Teacher creates group courses with predefined sessions. Enrolled_count gating to FULL. All sessions + Meet links generated on creation.
- `one-on-one-packages`: Teacher creates 1-on-1 packages. Sessions created incrementally via slot proposals.
- `booking`: Student books a group course or 1-on-1 package. Booking record tracks session counts. Meet links auto-created via Google Calendar API.
- `slot-proposals`: Student proposes next 1-on-1 session slot from teacher availability. Teacher confirms or counter-proposes. Session created on confirmation.
- `session-feedback`: After session → COMPLETED, student submits rating (1-5) + optional comment. Aggregates to teacher rating.
- `topic-requests`: Student submits a subject + topic. Teacher dashboard shows demand counts. Teacher can mark fulfilled when creating a matching course.
- `parent-access`: Student authorizes parent by name/phone/email. Parent verifies phone OTP → scoped read-only JWT. Sees student's bookings, sessions, feedback.
- `teacher-invite-links`: Teacher generates a unique invite code per course. Student clicks → signs up or logs in → auto-enrolled.
- `admin-dashboard-v2`: Verification queue, teacher suspension, course/booking oversight, cancellation request approval. No analytics.
- `teacher-cancellation-flow`: Teacher requests cancellation with reason → admin approves/rejects → students notified on approval.
- `email-notifications`: Consolidated email events: booking confirmed, session reminder (1h before), slot proposal/confirmation, cancellation, teacher verified/rejected.

### Modified Capabilities

- `teacher-availability`: Requirement changes from datetime-range slots to weekly grid (day_of_week + time range, recurring/specific-date, AVAILABLE/BLOCKED).

## Impact

- **DB**: Schema migration removes `teacher_tokens`, rewrites `teacher_profiles`, `teacher_availability`, `group_courses`, `one_on_one_packages`, `bookings`, `sessions`. New tables: `group_sessions`, `slot_proposals`, `session_feedback`, `topic_requests`, `parent_access`, `invite_links`.
- **Auth**: `lib/otp.ts` replaces email field with phone. MSG91 integration replaces Resend for OTP delivery.
- **API routes**: `/api/register/*` removed (phone OTP handles it). New routes for booking, slot proposals, feedback, topic requests, parent auth, invite links.
- **Pages**: `/register/student`, `/register/teacher`, `/admin/sessions/new` removed. New pages: `/browse`, `/teacher/[id]`, `/courses/[id]`, `/teacher/wizard`, `/parent/dashboard`.
- **Admin**: `/admin/sessions` page removed. New admin pages: verification queue, cancellation requests.
- **Dependencies**: Add MSG91 SDK or raw HTTP calls for SMS OTP.
- **Existing**: `lib/calendar.ts`, `lib/email.ts`, `lib/auth.ts`, `lib/prisma.ts` — all kept, extended.
