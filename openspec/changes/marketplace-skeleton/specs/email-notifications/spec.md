## ADDED Requirements

### Requirement: Booking confirmation email (group)
On group course booking, the system SHALL send a single email to the student and one to the teacher containing the full session schedule (all dates, times, Meet links).

#### Scenario: Group booking confirmed
- **WHEN** student completes group course booking
- **THEN** student and teacher each receive a booking confirmation email with all session details

### Requirement: 1-on-1 session confirmation emails
When a 1-on-1 session is created (first booking or slot proposal confirmed), the system SHALL send session details and Meet link to both student and teacher.

#### Scenario: First 1-on-1 session booked
- **WHEN** first 1-on-1 session is created on booking
- **THEN** student and teacher receive session confirmation with Meet link

#### Scenario: Next slot confirmed
- **WHEN** teacher confirms a slot proposal
- **THEN** student receives session confirmation with date, time, Meet link

### Requirement: Session reminder email (1 hour before)
The system SHALL send a reminder email to both student and teacher 1 hour before each SCHEDULED session. Reminders are sent by a cron job. Only one reminder per session (reminderSentAt prevents re-sending).

#### Scenario: Reminder sent once
- **WHEN** cron runs and finds sessions starting within 1 hour with reminderSentAt null
- **THEN** reminder emails sent, reminderSentAt set

#### Scenario: Reminder not sent twice
- **WHEN** cron runs again for the same session
- **THEN** session already has reminderSentAt set — no email sent

### Requirement: Slot proposal notification
When a student proposes a slot, the teacher SHALL receive an email with proposed date/time and a link to confirm or suggest an alternative.

#### Scenario: Slot proposed
- **WHEN** student submits a slot proposal
- **THEN** teacher receives email with proposed time and confirmation link

### Requirement: Cancellation notification
When admin approves a teacher cancellation request, all affected students SHALL receive a cancellation notification email.

#### Scenario: Cancellation approved
- **WHEN** admin approves cancellation
- **THEN** each enrolled student receives a cancellation email with the session details

### Requirement: Teacher verification status emails
When admin changes a teacher's verification status, the teacher SHALL receive an email reflecting the decision.

#### Scenario: Approved
- **WHEN** admin approves teacher profile
- **THEN** teacher receives approval email

#### Scenario: Rejected
- **WHEN** admin rejects teacher profile with reason
- **THEN** teacher receives rejection email containing the reason text
