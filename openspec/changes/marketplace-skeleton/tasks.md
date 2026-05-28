## 0. ENV & Config (do this first — blocks everything else)

- [x] 0.1 Add `MSG91_API_KEY`, `MSG91_TEMPLATE_ID` to `.env.local` and `.env.local.example`
- [x] 0.2 Add `AUTH_MODE=phone` flag (fall back to `email` if MSG91 DLT not yet approved)
- [x] 0.3 Verify all existing env vars still apply: `DATABASE_URL`, `RESEND_API_KEY`, Google Calendar service account creds

## 1. Dead Code Removal

- [x] 1.1 Delete `/app/register/student/page.tsx` and `/app/register/teacher/page.tsx` (replaced by inline OTP registration)
- [x] 1.2 Delete `/app/register/page.tsx`
- [x] 1.3 Delete `/app/admin/sessions/new/` directory and all files
- [x] 1.4 Delete `/app/admin/sessions/SessionsClient.tsx` (admin no longer creates sessions)
- [x] 1.5 Delete `/app/api/register/student/route.ts` and `/app/api/register/teacher/route.ts`
- [x] 1.6 Delete `/app/api/sessions/route.tsx` and `/app/api/sessions/[id]/route.tsx` (replaced by booking-driven session creation)
- [x] 1.7 Delete `/app/api/admin/registrations/` directory (replaced by teacher verification queue)
- [x] 1.8 Delete `/app/admin/registrations/` directory and all files
- [x] 1.9 `TeacherToken` kept + `/app/schedule/[token]/page.tsx` kept — per spec "existing public /schedule/[token] page remains unchanged"

## 2. Database Schema Migration

- [x] 2.1 Rewrite `prisma/schema.prisma`: add `phone` to User, remove `TeacherToken` model
- [x] 2.2 Expand `TeacherProfile`: add `qualifications`, `target_exams String[]`, `profile_photo_url`, `teaching_experience_years`, `demo_video_link`, `social_media_links Json?`, rename `verifyStatus` values to match spec (add `MORE_INFO_REQUESTED`)
- [x] 2.3 Rewrite `TeacherAvailability`: replace `startTime/endTime DateTime` with `day_of_week`, `start_time`, `end_time`, `is_recurring`, `specific_date`, `status` fields
- [x] 2.4 Expand `GroupCourse`: add `target_exam`, `total_sessions`, `session_duration_minutes`, `enrolled_count`, `start_date`; rename `ACTIVE` status to `LISTED`, add `FULL` status
- [x] 2.5 Expand `OneOnOnePackage`: add `target_exam`, `session_duration_minutes`; rename fields to match spec; rename `ACTIVE` to `LISTED`
- [x] 2.6 Rewrite `Booking`: add `course_type`, `total_sessions`, `sessions_completed`, `sessions_scheduled`, `sessions_remaining`, `booked_at`
- [x] 2.7 Rewrite `Session`: add `booking_id` FK, `session_number`, `NO_SHOW` status; drop direct `teacher_id` / `students[]` junction (sessions are now booking-scoped)
- [x] 2.8 Rename `SlotProposal` fields to match spec: `proposed_date`, `proposed_start_time`, `teacher_note`; fix FK to `booking_id` (not `packageId`)
- [x] 2.9 Add new tables: `session_feedback`, `topic_requests` (with `status OPEN/FULFILLED` and `fulfilled_by_course_id Int?` FK), `parent_access`, `invite_links` (with `group_course_id Int?` + `one_on_one_package_id Int?` nullable FKs — exactly one set)
- [x] 2.10 Add `parentStudentId Int?` to `user_sessions` with explicit FK to `users.id`, indexed; add `@@index([parentStudentId])`
- [x] 2.11 Add `reminderSentAt` to sessions (already exists — verify and keep)
- [x] 2.12 Generate and run migration: `npx prisma migrate dev --name marketplace-skeleton`

## 3. Auth — Phone OTP (MSG91)

- [x] 3.1 Update `otp_codes` table: rename `email` column to `phone`
- [x] 3.2 Update `lib/otp.ts`: replace Resend OTP delivery with MSG91 HTTP POST to `https://control.msg91.com/api/v5/otp`; add `MSG91_API_KEY` and `MSG91_TEMPLATE_ID` env vars
- [x] 3.3 Update `POST /api/auth/otp/request`: accept `phone` field; validate E.164 format; apply 3/hour rate limit per phone
- [x] 3.4 Update `POST /api/auth/otp/verify`: on new phone → return `needs_registration: true` + short-lived token; on existing phone → create session
- [x] 3.5 Add `POST /api/auth/register`: accepts registration token + name + email + role → creates User row, issues full session
- [x] 3.6 Update `middleware.ts`: keep role-based route guards; add parent-scoped session check (reads `parentStudentId` from session)
- [x] 3.7 Update login page `/app/login/page.tsx`: phone number input, OTP input, inline registration step (name/email/role) for new users

## 4. Public Browse

- [x] 4.1 Create `/app/browse/page.tsx`: server component fetching VERIFIED + non-SUSPENDED teachers with LISTED courses
- [x] 4.2 Add subject / target_exam / course_type filter UI (client-side, no server round-trip)
- [x] 4.3 Add price asc/desc and start_date sort
- [x] 4.4 Create `/app/teacher/[id]/page.tsx`: teacher profile page with bio, qualifications, demo video embed, active courses
- [x] 4.5 Update landing page `/app/page.tsx`: link to /browse; show hero CTA with "Browse Teachers" button

## 5. Teacher Profile Wizard

- [x] 5.1 Create `/app/teacher/wizard/page.tsx`: multi-step wizard shell with step state management
- [x] 5.2 Step 1 — Basic info: name, phone (pre-filled from auth), email, subjects (multi-select), target_exams (multi-select)
- [x] 5.3 Step 2 — Qualifications: free text qualifications field, teaching_experience_years
- [x] 5.4 Step 3 — Demo video: demo_video_link URL input with YouTube embed preview
- [x] 5.5 Step 4 — Social links: youtube, instagram, twitter, linkedin inputs (stored as jsonb)
- [x] 5.6 Step 5 — Review & submit: summary of all entered data, submit button sets status to PENDING
- [x] 5.7 Add draft persistence: save wizard state to DB (partial TeacherProfile) on each step save
- [x] 5.8 Create `PUT /api/teacher/profile/route.ts`: upsert TeacherProfile fields
- [x] 5.9 Create `POST /api/teacher/profile/submit/route.ts`: sets verifyStatus = PENDING

## 6. Admin Dashboard V2 — Verification & Oversight

- [x] 6.1 Create `/app/admin/verification/page.tsx`: lists PENDING teacher profiles with approve/reject/request-info actions
- [x] 6.2 Create `POST /api/admin/teacher/[id]/verify/route.ts`: handles APPROVE / REJECT / MORE_INFO_REQUESTED with reason
- [x] 6.3 Update `/app/admin/teachers/page.tsx`: show VERIFIED teachers with Suspend/Unsuspend action
- [x] 6.4 Create `POST /api/admin/teacher/[id]/suspend/route.ts`: toggles User.status between ACTIVE and SUSPENDED
- [x] 6.5 Create `/app/admin/courses/page.tsx`: all courses across teachers, filter by teacher/subject/status (read-only)
- [x] 6.6 Update `/app/admin/page.tsx` (dashboard index): remove session-creation links; add links to verification queue and cancellation requests
- [x] 6.7 Create `/app/admin/cancellations/page.tsx`: pending teacher cancellation requests with approve/reject

## 7. Group Course Management (Teacher)

- [x] 7.1 Create `/app/teacher/courses/new/page.tsx`: group course creation form
- [x] 7.2 Create `POST /api/teacher/courses/group/route.ts`: creates GroupCourse + all GroupSession rows + Meet links via `lib/calendar.ts`
- [x] 7.3 Create `PATCH /api/teacher/courses/group/[id]/route.ts`: publish DRAFT → LISTED
- [x] 7.4 Update teacher dashboard `/app/teacher/dashboard/page.tsx`: show own courses with status and enrolled_count

## 8. 1-on-1 Package Management (Teacher)

- [x] 8.1 Create `/app/teacher/packages/new/page.tsx`: 1-on-1 package creation form
- [x] 8.2 Create `POST /api/teacher/packages/route.ts`: creates OneOnOnePackage
- [x] 8.3 Create `PATCH /api/teacher/packages/[id]/route.ts`: publish DRAFT → LISTED

## 9. Teacher Availability (Rewrite)

- [x] 9.1 Rewrite `/app/teacher/dashboard/AvailabilitySection.tsx`: weekly grid UI (day columns, time range rows, recurring toggle, block specific date)
- [x] 9.2 Rewrite `POST /api/teacher/availability/route.ts`: create availability row with new schema fields
- [x] 9.3 Update `DELETE /api/teacher/availability/[id]/route.ts`: no change needed, verify it still works

## 10. Booking (Student)

- [x] 10.1 Create `/app/courses/[id]/book/page.tsx`: booking confirmation page for group courses
- [x] 10.2 Create `POST /api/bookings/group/route.ts`: creates Booking, increments enrolled_count, sends confirmation email
- [x] 10.3 Create `/app/packages/[id]/book/page.tsx`: 1-on-1 package booking + first slot picker
- [x] 10.4 Create `POST /api/bookings/one-on-one/route.ts`: creates Booking + first Session + Meet link, sends confirmation emails
- [x] 10.5 Create `/app/student/dashboard/page.tsx`: rewrite to show bookings list (group and 1-on-1) with session counts and upcoming sessions

## 11. Slot Proposals (1-on-1 Rolling Schedule)

- [x] 11.1 Create `POST /api/bookings/[id]/proposals/route.ts`: student creates PENDING slot proposal
- [x] 11.2 Create `PATCH /api/proposals/[id]/route.ts`: teacher confirms (creates Session + Meet link) or rejects (with note)
- [x] 11.3 Add proposal UI to student dashboard: "Schedule next session" button when sessions_remaining > 0 and no pending proposal
- [x] 11.4 Add proposal response UI to teacher dashboard: pending proposals with confirm/reject controls

## 12. Session Feedback

- [x] 12.1 Create `POST /api/sessions/[id]/feedback/route.ts`: creates session_feedback, recalculates teacher_profile.rating
- [x] 12.2 Add feedback form to student session detail page (only shown when session.status = COMPLETED and no existing feedback)
- [x] 12.3 Add feedback display to teacher dashboard per completed session
- [x] 12.4 Add feedback list to admin dashboard

## 13. Topic Requests

- [x] 13.1 Create `POST /api/topic-requests/route.ts`: student submits subject + topic_description
- [x] 13.2 Add topic request form to student dashboard
- [~] 13.3 Add demand signal panel to teacher dashboard: grouped topic_requests with counts
- [~] 13.4 Link topic request to course at creation time: optional field in course/package creation form that marks matching requests FULFILLED

## 14. Parent Access

- [x] 14.1 Create `POST /api/student/parent-access/route.ts`: student adds parent, OTP sent to parent's phone
- [x] 14.2 Create `POST /api/auth/parent/verify/route.ts`: parent verifies OTP, creates scoped UserSession with parentStudentId
- [x] 14.3 Create `/app/parent/login/page.tsx`: phone OTP login page for parents
- [x] 14.4 Create `/app/parent/dashboard/page.tsx`: read-only view of linked student's bookings, sessions, feedback
- [x] 14.5 Add parent management UI to student settings: list authorized parents, add new parent

## 15. Teacher Invite Links

- [x] 15.1 Create `POST /api/teacher/invite-links/route.ts`: generates invite_links row with 12-char code
- [x] 15.2 Create `/app/invite/[code]/page.tsx`: resolves code, redirects to login if unauthenticated, creates booking on return
- [~] 15.3 Add invite link generation UI to teacher course/package management pages

## 16. Teacher Cancellation Flow

- [x] 16.1 Create `POST /api/teacher/cancellation-requests/route.ts`: teacher submits cancellation request with reason
- [x] 16.2 Create `PATCH /api/admin/cancellation-requests/[id]/route.ts`: admin approves (cancels session, notifies students) or rejects
- [x] 16.3 Add cancellation request button to teacher session/course detail pages

## 17. Email Notifications (build before booking tasks — 10.x depends on these)

- [x] 17.1 Create `lib/emails/booking-confirmed-group.tsx`: student email with all session dates + Meet links
- [x] 17.2 Create `lib/emails/booking-confirmed-teacher.tsx`: teacher notification of new group enrollment
- [x] 17.3 Create `lib/emails/session-confirmed-1on1.tsx`: both-sides confirmation for 1-on-1 session
- [x] 17.4 Create `lib/emails/slot-proposed.tsx`: teacher notification of student slot proposal
- [x] 17.5 Create `lib/emails/slot-confirmed.tsx`: student notification of confirmed slot
- [x] 17.6 Create `lib/emails/session-cancelled.tsx`: update existing template if needed
- [x] 17.7 Create `lib/emails/teacher-verified.tsx` and `lib/emails/teacher-rejected.tsx`
- [x] 17.8 Update cron `/app/api/cron/session-reminders/route.ts`: adapt to new sessions schema (booking-scoped sessions)

## 18. Deferred (explicitly cut from MVP)

- ~~18.1 Task 15.3 — Invite link generation UI on teacher pages~~ (generate via API call, copy link; no UI needed for MVP)
- ~~18.2 Task 13.4 — Topic request → course linkage at creation~~ (manual admin action for now; FK column exists in schema for when it's built)
- ~~18.3 Task 13.3 — Demand signal panel on teacher dashboard~~ (defer until topic requests have enough volume to be useful)
