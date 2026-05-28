## ADDED Requirements

### Requirement: Student submits a topic request
An authenticated STUDENT SHALL be able to submit a topic request with a subject and free-text topic_description. Status defaults to OPEN.

#### Scenario: Student submits topic request
- **WHEN** student submits a valid subject and topic description
- **THEN** topic_requests record created with status OPEN

### Requirement: Teacher sees aggregated demand
On the teacher dashboard, the system SHALL show topic_requests grouped by subject and topic, with a count of students who requested each topic. Only OPEN requests are shown.

#### Scenario: Teacher views demand
- **WHEN** teacher opens their dashboard
- **THEN** they see "N students want [topic] in [subject]" for all OPEN topic_requests

### Requirement: Teacher fulfils a topic request
When a teacher creates a group course or 1-on-1 package, they SHALL be able to optionally link it to one or more topic_requests. Linked requests change status to FULFILLED.

#### Scenario: Teacher links course to topic request
- **WHEN** teacher creates a course and selects a matching topic request
- **THEN** topic_request status changes to FULFILLED, linked to the new course
