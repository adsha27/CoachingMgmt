## ADDED Requirements

### Requirement: Teacher dashboard — upcoming sessions
The system SHALL show an authenticated teacher their upcoming scheduled sessions, ordered by date ascending. Only sessions with status `SCHEDULED` and `scheduledDate >= now` SHALL appear.

#### Scenario: Teacher has upcoming sessions
- **WHEN** a logged-in teacher visits `/teacher/dashboard`
- **THEN** they see a list of upcoming sessions showing: subject, date, time, duration, student names, and a "Join Meet" button (if meetLink is set)

#### Scenario: Teacher has no upcoming sessions
- **WHEN** a logged-in teacher visits `/teacher/dashboard` with no future scheduled sessions
- **THEN** they see an empty state message: "No upcoming sessions. Check back after your admin schedules one."

#### Scenario: Unauthenticated access
- **WHEN** an unauthenticated user visits `/teacher/dashboard`
- **THEN** middleware redirects to `/login`

---

### Requirement: Teacher session detail
The system SHALL show a teacher the full detail of a specific session including student contact information.

#### Scenario: Valid session for this teacher
- **WHEN** a logged-in teacher visits `/teacher/sessions/[id]`
- **THEN** they see: subject, date, time, duration, Meet link, list of enrolled students (name + email), and session status

#### Scenario: Session belongs to different teacher
- **WHEN** a logged-in teacher requests a session ID that belongs to another teacher
- **THEN** the page returns 404

---

### Requirement: Teacher profile view
The system SHALL show the teacher their own profile (name, email, phone) on the dashboard.

#### Scenario: Profile header
- **WHEN** a logged-in teacher visits `/teacher/dashboard`
- **THEN** their name and email are displayed in the page header

---

### Requirement: Past session history
The system SHALL show teachers a paginated list of their past sessions (status `COMPLETED` or `CANCELLED`, or `scheduledDate < now`).

#### Scenario: History tab
- **WHEN** a logged-in teacher clicks "Past sessions"
- **THEN** they see sessions in reverse chronological order with status badges

---

### Requirement: Teacher logout
The system SHALL allow a teacher to log out from their portal.

#### Scenario: Logout link
- **WHEN** a logged-in teacher clicks "Sign out"
- **THEN** their session is cleared and they are redirected to `/login`
