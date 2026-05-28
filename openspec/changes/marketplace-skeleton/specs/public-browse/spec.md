## ADDED Requirements

### Requirement: Unauthenticated teacher and course listing
The system SHALL serve a public listing page at /browse showing all VERIFIED, non-SUSPENDED teachers with their LISTED courses. No login required.

#### Scenario: Anonymous visitor browses
- **WHEN** an unauthenticated user visits /browse
- **THEN** system returns teacher cards with profile photo, name, subjects, and active courses — no login prompt

### Requirement: Filters and sort
The listing SHALL support filtering by subject, target_exam, and course_type (GROUP / ONE_ON_ONE). It SHALL support sorting by price (asc/desc) and start_date (asc). Filters are applied client-side (under 20 teachers at launch).

#### Scenario: Filter by subject
- **WHEN** user selects a subject filter
- **THEN** only teachers with courses in that subject are shown

#### Scenario: Sort by price
- **WHEN** user selects sort by price ascending
- **THEN** courses are ordered cheapest first

### Requirement: Teacher profile page
Each teacher SHALL have a public profile page at /teacher/[id] showing bio, qualifications, subjects, experience, demo video embed, and active courses.

#### Scenario: Teacher profile page loads
- **WHEN** user visits /teacher/[id] for a VERIFIED teacher
- **THEN** full profile is shown with all active courses listed

#### Scenario: Suspended teacher profile
- **WHEN** user visits /teacher/[id] for a SUSPENDED teacher
- **THEN** system returns 404

### Requirement: Login gate for booking
Browse and profile viewing require no login. Booking a course SHALL redirect unauthenticated users to /login with a return URL.

#### Scenario: Unauthenticated user tries to book
- **WHEN** anonymous user clicks "Book" on a course
- **THEN** system redirects to /login?return=/courses/[id]/book
