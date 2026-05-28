## ADDED Requirements

### Requirement: Teacher creates a 1-on-1 package
A VERIFIED teacher SHALL be able to create a 1-on-1 package with: title, description, subject, target_exam (optional), total_sessions, session_duration_minutes, price. No sessions are predefined — they are created one at a time as the student schedules them.

#### Scenario: Package creation
- **WHEN** verified teacher submits valid package details
- **THEN** package created with status DRAFT, no sessions created yet

### Requirement: Package status lifecycle
Package status follows: DRAFT → LISTED → CLOSED. Teacher manually publishes and closes. No FULL state (packages are 1-on-1, not capacity-limited).

#### Scenario: Teacher lists a package
- **WHEN** teacher publishes a DRAFT package
- **THEN** status becomes LISTED, package appears in public browse under the teacher's profile

### Requirement: Session count tracking
The booking record SHALL track total_sessions, sessions_completed, sessions_scheduled, and sessions_remaining. The package is considered consumed when sessions_remaining reaches 0.

#### Scenario: Session counts update after completion
- **WHEN** a 1-on-1 session status changes to COMPLETED
- **THEN** booking.sessions_completed increments and sessions_remaining decrements
