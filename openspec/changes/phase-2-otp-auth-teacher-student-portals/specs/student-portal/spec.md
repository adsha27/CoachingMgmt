## ADDED Requirements

### Requirement: Student dashboard — enrolled sessions
The system SHALL show an authenticated student their upcoming enrolled sessions, ordered by date ascending.

#### Scenario: Student has upcoming sessions
- **WHEN** a logged-in student visits `/student/dashboard`
- **THEN** they see a list of upcoming sessions showing: subject, teacher name, date, time, duration, and a "Join Meet" button (if meetLink is set)

#### Scenario: Student has no upcoming sessions
- **WHEN** a logged-in student visits `/student/dashboard` with no future enrolled sessions
- **THEN** they see: "No upcoming sessions. Your admin will add you to sessions."

#### Scenario: Unauthenticated access
- **WHEN** an unauthenticated user visits `/student/dashboard`
- **THEN** middleware redirects to `/login`

---

### Requirement: Student session detail
The system SHALL show a student the details of a specific enrolled session.

#### Scenario: Valid enrolled session
- **WHEN** a logged-in student visits `/student/sessions/[id]` for a session they are enrolled in
- **THEN** they see: subject, teacher name, date, time, duration, and Meet link

#### Scenario: Session not enrolled
- **WHEN** a logged-in student requests a session ID they are not enrolled in
- **THEN** the page returns 404

---

### Requirement: Student profile view
The system SHALL show the student their own profile (name, email) on the dashboard.

#### Scenario: Profile header
- **WHEN** a logged-in student visits `/student/dashboard`
- **THEN** their name and email are displayed in the page header

---

### Requirement: Past session history
The system SHALL show students a list of past sessions they were enrolled in.

#### Scenario: History tab
- **WHEN** a logged-in student clicks "Past sessions"
- **THEN** they see sessions in reverse chronological order with teacher name and status

---

### Requirement: Student logout
The system SHALL allow a student to log out from their portal.

#### Scenario: Logout link
- **WHEN** a logged-in student clicks "Sign out"
- **THEN** their session is cleared and they are redirected to `/login`
