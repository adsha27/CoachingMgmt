## ADDED Requirements

### Requirement: Group course booking
An authenticated STUDENT SHALL be able to book a LISTED group course that is not FULL. On booking: a Booking record is created, enrolled_count increments, and the student receives all session details and Meet links via email.

#### Scenario: Successful group booking
- **WHEN** student books a LISTED group course
- **THEN** Booking created (status ACTIVE), enrolled_count incremented, booking confirmation email sent with all session dates and Meet links

#### Scenario: Booking a FULL course
- **WHEN** student attempts to book a FULL course
- **THEN** system returns 409, no booking created

#### Scenario: Duplicate booking
- **WHEN** student who already has an ACTIVE booking for a course tries to book again
- **THEN** system returns 409

### Requirement: 1-on-1 package booking
An authenticated STUDENT SHALL be able to book a LISTED 1-on-1 package. On booking: a Booking record is created and the student immediately picks the first session slot from the teacher's availability. First session is created with a Meet link on slot confirmation.

#### Scenario: Successful 1-on-1 booking with first slot
- **WHEN** student books a 1-on-1 package and selects a first slot
- **THEN** Booking created, Session created for first slot, Meet link provisioned, confirmation emails sent to student and teacher

### Requirement: Booking record integrity
The Booking record SHALL contain exactly one of groupCourseId or oneOnOnePackageId (never both, never neither). This is enforced at the application layer before DB write.

#### Scenario: Booking references correct course type
- **WHEN** a group booking is created
- **THEN** groupCourseId is set, oneOnOnePackageId is null

### Requirement: Booking cancellation (manual MVP)
Cancellations are handled manually out-of-system for MVP. The system SHALL allow admin to change a booking status to CANCELLED. No automated refund or in-system student cancellation flow.

#### Scenario: Admin cancels booking
- **WHEN** admin sets a booking status to CANCELLED
- **THEN** booking status updates, enrolled_count decrements if group course
