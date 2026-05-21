# TODOS

## Phase 1 → Phase 2

- [ ] **Token expiry for teacher schedule URLs**
  - What: Add `token_expires_at` column to `teacher_tokens` table. Refresh on each schedule page visit. 30-day rolling expiry.
  - Why: Permanent tokens forwarded on WhatsApp expose student schedules indefinitely. Student names on a teacher's schedule page is sensitive info.
  - Where to start: `teacher_tokens` table migration + GET /schedule/:token handler.
  - Blocked by: Nothing — can be added in Phase 1 or early Phase 2.

## Phase 2 → Phase 3

- [ ] **Calendar orphaned event reconciliation script**
  - What: A one-off script that lists all Calendar events created by the service account and cross-checks against the `sessions` table. Deletes events with no matching session.
  - Why: When Calendar API succeeds but DB insert fails, the Calendar event ID is logged but no automated cleanup exists. At Phase 1 scale this is harmless; at Phase 2+ it becomes maintenance debt.
  - Where to start: `scripts/reconcile-calendar-events.ts`. Runs manually on-demand.
  - Blocked by: Phase 1 logging of orphaned event IDs (must be implemented first).

## Phase 3 / Post-Phase-3

- [ ] **Automated session COMPLETED status**
  - What: After session end_time passes, automatically mark session as COMPLETED.
  - Why: Manual status is fine for Phase 1/2 but creates stale data at scale — teachers see "SCHEDULED" sessions from last week.
  - Where to start: A scheduled job (cron via node-cron or pg_cron) that runs nightly.
  - Blocked by: Phase 2 (need proper role-based auth before automated writes matter).

- [ ] **Rolling slot proposal/confirmation for 1-on-1 packages**
  - What: After a 1-on-1 session completes, student proposes next slot → teacher confirms or counter-proposes.
  - Why: The current spec defers this. Validate with operator in Phase 2 whether teachers actually want formal in-app proposal flow vs. just "admin creates next session."
  - Where to start: `slot_proposals` table (already in full schema), proposal API routes.
  - Blocked by: Operator validation of this pain point during Phase 2.
