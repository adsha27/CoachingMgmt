## ADDED Requirements

### Requirement: Student authorizes parent access
An authenticated STUDENT SHALL be able to add a parent by providing parent name, phone, and email. The system sends an OTP to the parent's phone to verify ownership. One student can authorize multiple parents.

#### Scenario: Student adds parent
- **WHEN** student submits parent name, phone, email
- **THEN** parent_access record created (verified = false), OTP sent to parent's phone

#### Scenario: Parent verifies phone
- **WHEN** parent submits correct OTP
- **THEN** parent_access.verified = true, last_accessed_at updated

### Requirement: Parent scoped session
After verification, parent SHALL log in via /parent/login by entering their phone and OTP. On successful verification, the system issues a JWT with parent_flag=true and student_id scoped to the linked student. Session is read-only.

#### Scenario: Parent logs in
- **WHEN** parent enters their verified phone and correct OTP
- **THEN** system issues a scoped JWT, parent sees /parent/dashboard with the linked student's data

#### Scenario: Parent tries to book
- **WHEN** parent session attempts a write operation (booking, feedback, etc.)
- **THEN** middleware returns 403

### Requirement: Parent dashboard content
The parent dashboard SHALL show: student's upcoming sessions (date, time, Meet link, teacher name), session history, and per-session feedback submitted by the student. No edit controls.

#### Scenario: Parent views upcoming sessions
- **WHEN** parent opens /parent/dashboard
- **THEN** student's upcoming sessions are listed in chronological order

### Requirement: Multiple parent support
A student SHALL be able to authorize more than one parent. Each parent has an independent parent_access row and independent session.

#### Scenario: Second parent added
- **WHEN** student adds a second parent phone
- **THEN** a new parent_access row is created; first parent's access is unaffected
