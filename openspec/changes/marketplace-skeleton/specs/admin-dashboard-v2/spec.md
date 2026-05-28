## ADDED Requirements

### Requirement: Teacher verification queue
Admin SHALL see all PENDING teacher profiles in a verification queue. Each entry shows teacher name, submitted qualifications, subjects, demo video link, and profile photo. Admin can APPROVE, REJECT (with reason), or REQUEST_MORE_INFO.

#### Scenario: Admin approves teacher
- **WHEN** admin clicks Approve on a PENDING profile
- **THEN** TeacherProfile.verifyStatus = VERIFIED, teacher notified by email

#### Scenario: Admin rejects teacher
- **WHEN** admin clicks Reject and provides a reason
- **THEN** TeacherProfile.verifyStatus = REJECTED, rejection_reason stored, teacher notified

### Requirement: Active teacher management
Admin SHALL see a list of all VERIFIED teachers. Admin can suspend or unsuspend any teacher.

#### Scenario: Admin suspends teacher
- **WHEN** admin clicks Suspend on a VERIFIED teacher
- **THEN** User.status = SUSPENDED, teacher's courses hidden from browse

### Requirement: Course oversight
Admin SHALL see all courses across all teachers, filterable by teacher, subject, and status. Read-only view — admin does not create or edit courses.

#### Scenario: Admin filters courses by teacher
- **WHEN** admin selects a teacher filter
- **THEN** only courses belonging to that teacher are shown

### Requirement: Booking oversight
Admin SHALL see all bookings across all students and courses, filterable by teacher, student, and status.

#### Scenario: Admin views bookings
- **WHEN** admin opens the bookings list
- **THEN** all bookings are shown with student name, course name, teacher name, status, booked_at

### Requirement: Teacher cancellation requests
Admin SHALL see all pending teacher cancellation requests with teacher name, course name, reason. Admin can APPROVE or REJECT each request.

#### Scenario: Admin approves cancellation
- **WHEN** admin approves a cancellation request
- **THEN** session/course is marked CANCELLED, affected students notified by email

#### Scenario: Admin rejects cancellation
- **WHEN** admin rejects a cancellation request
- **THEN** cancellation request status = REJECTED, teacher notified
