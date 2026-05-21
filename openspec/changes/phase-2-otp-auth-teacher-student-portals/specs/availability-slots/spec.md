## ADDED Requirements

### Requirement: Teacher proposes availability
The system SHALL allow a logged-in teacher to create an availability slot by specifying a start time, end time, and optional note.

#### Scenario: Valid slot creation
- **WHEN** a logged-in teacher submits a start time, end time, and optional note via the availability form
- **THEN** a `teacher_availability` row is created and the slot appears in their availability list

#### Scenario: End time before start time
- **WHEN** a teacher submits an end time that is before or equal to the start time
- **THEN** the form returns a validation error: "End time must be after start time"

---

### Requirement: Teacher views own availability
The system SHALL show a teacher a list of their proposed availability slots, ordered by start time ascending.

#### Scenario: Availability list
- **WHEN** a logged-in teacher views their availability section on `/teacher/dashboard`
- **THEN** they see all upcoming slots (start time, end time, note, delete button)

---

### Requirement: Teacher deletes availability slot
The system SHALL allow a teacher to delete one of their own availability slots.

#### Scenario: Slot deletion
- **WHEN** a teacher clicks "Delete" on one of their availability slots
- **THEN** the `teacher_availability` row is deleted and the slot disappears from the list

#### Scenario: Deleting another teacher's slot
- **WHEN** the delete API is called with a slot ID that belongs to a different teacher
- **THEN** the API returns HTTP 403

---

### Requirement: Admin sees teacher availability when scheduling
The system SHALL display a teacher's proposed availability slots on the session creation form when a teacher is selected.

#### Scenario: Availability shown on session creation
- **WHEN** an admin selects a teacher on `/admin/sessions/new`
- **THEN** the teacher's upcoming availability slots are shown as reference (read-only) below the teacher dropdown

#### Scenario: Teacher has no slots
- **WHEN** an admin selects a teacher with no availability slots
- **THEN** no slots section is shown (no error, just omitted)
