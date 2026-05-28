## ADDED Requirements

### Requirement: Post-session feedback submission
After a session status changes to COMPLETED, the enrolled student SHALL be able to submit a rating (1-5 integer) and an optional comment. One feedback record per student per session — no updates after submission.

#### Scenario: Student submits feedback
- **WHEN** student submits rating and comment for a COMPLETED session
- **THEN** session_feedback record created, teacher can see it on their dashboard

#### Scenario: Feedback on non-completed session
- **WHEN** student tries to submit feedback for a SCHEDULED or CANCELLED session
- **THEN** system returns 400

#### Scenario: Duplicate feedback
- **WHEN** student submits feedback for a session they already reviewed
- **THEN** system returns 409

### Requirement: Teacher feedback visibility
Teacher SHALL see all feedback for their sessions on their dashboard, per session, with rating and comment.

#### Scenario: Teacher views feedback
- **WHEN** teacher opens their dashboard
- **THEN** each completed session shows aggregated star rating and individual comments

### Requirement: Admin feedback visibility
Admin SHALL be able to see all feedback across all teachers for oversight.

#### Scenario: Admin views all feedback
- **WHEN** admin navigates to the feedback section
- **THEN** all session_feedback records are listed, filterable by teacher

### Requirement: Rating aggregation
The teacher_profile.rating field SHALL be updated as a running average whenever a new feedback record is created.

#### Scenario: Rating updates on new feedback
- **WHEN** a session_feedback record is created
- **THEN** teacher_profile.rating is recalculated as AVG(rating) across all feedback for that teacher
