## ADDED Requirements

### Requirement: Teacher creates a group course
A VERIFIED teacher SHALL be able to create a group course with: title, description, subject, target_exam (optional), total_sessions, session_duration_minutes, price, max_students, start_date. All sessions are predefined at creation time with scheduled_date, start_time, and auto-generated Meet links.

#### Scenario: Successful course creation
- **WHEN** verified teacher submits a valid group course form
- **THEN** course is created with status DRAFT, all GroupSession rows created, Meet links provisioned via Google Calendar API

#### Scenario: Unverified teacher tries to create course
- **WHEN** teacher with status != VERIFIED attempts to create a course
- **THEN** system returns 403

### Requirement: Course status lifecycle
Course status follows: DRAFT → LISTED → FULL (auto) → CLOSED. Teacher can publish DRAFT to LISTED manually. System auto-sets FULL when enrolled_count equals max_students. Teacher or system sets CLOSED after last session completes.

#### Scenario: Course reaches capacity
- **WHEN** a booking brings enrolled_count equal to max_students
- **THEN** course status automatically changes to FULL and no further bookings are accepted

#### Scenario: Teacher lists a draft
- **WHEN** teacher publishes a DRAFT course
- **THEN** status becomes LISTED and course appears in public browse

### Requirement: Session predefinition
All sessions for a group course SHALL be created when the course is created, each with a unique session_number, scheduled_date, start_time, duration_minutes, and a Meet link. Sessions are visible to enrolled students immediately after booking.

#### Scenario: Sessions created on course creation
- **WHEN** teacher creates a group course with total_sessions = 5
- **THEN** 5 GroupSession rows are created with sequential session_number and scheduled dates

### Requirement: Course visibility on suspension
When a teacher is suspended, all their LISTED group courses SHALL be hidden from public browse without changing the course status in the database.

#### Scenario: Suspended teacher's courses hidden
- **WHEN** teacher is suspended
- **THEN** /browse and /teacher/[id] return no courses for that teacher
