## ADDED Requirements

### Requirement: Teacher requests cancellation
A TEACHER SHALL be able to submit a cancellation request for a session or course with a mandatory reason. The request cannot self-approve — admin action is required.

#### Scenario: Teacher submits cancellation request
- **WHEN** teacher submits a cancellation request with a reason
- **THEN** cancellation_requests record created with status PENDING, admin notified by email

#### Scenario: Teacher tries to cancel without reason
- **WHEN** teacher submits cancellation with empty reason
- **THEN** system returns 400, no request created

### Requirement: Admin approves or rejects cancellation
Admin SHALL review pending cancellation requests and APPROVE or REJECT each.

#### Scenario: Admin approves
- **WHEN** admin approves a session cancellation request
- **THEN** session status = CANCELLED, all enrolled students notified by email, request status = APPROVED

#### Scenario: Admin rejects
- **WHEN** admin rejects a cancellation request
- **THEN** session remains SCHEDULED, request status = REJECTED, teacher notified
