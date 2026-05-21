## ADDED Requirements

### Requirement: 24-hour session reminder
The system SHALL send a reminder email to the teacher and all enrolled students for each session that starts between 23 and 25 hours from now, if a reminder has not already been sent (`reminderSentAt IS NULL`).

#### Scenario: Reminder sent successfully
- **WHEN** the cron job runs and finds a session starting in 23–25 hours with `reminderSentAt = null`
- **THEN** a reminder email is sent to the teacher and all enrolled students, and `reminderSentAt` is updated to the current timestamp

#### Scenario: Reminder already sent
- **WHEN** the cron job runs and a session has `reminderSentAt IS NOT NULL`
- **THEN** no email is sent for that session

#### Scenario: Session is cancelled
- **WHEN** the cron job encounters a session with `status = CANCELLED`
- **THEN** no reminder is sent for that session

---

### Requirement: Cron endpoint security
The system SHALL require a `CRON_SECRET` bearer token to trigger the reminder cron endpoint.

#### Scenario: Valid cron token
- **WHEN** `GET /api/cron/session-reminders` is called with `Authorization: Bearer <CRON_SECRET>`
- **THEN** the job runs and returns `{ sent: N, errors: [] }`

#### Scenario: Missing or wrong token
- **WHEN** `GET /api/cron/session-reminders` is called without a valid `CRON_SECRET`
- **THEN** the endpoint returns HTTP 401

---

### Requirement: Reminder email content
The reminder email SHALL include session subject, teacher name, date, time, duration, and Meet link.

#### Scenario: Reminder email fields
- **WHEN** a reminder email is sent
- **THEN** it contains: subject line "Reminder: [subject] tomorrow", body with teacher name, date, time, duration, and clickable Meet link
