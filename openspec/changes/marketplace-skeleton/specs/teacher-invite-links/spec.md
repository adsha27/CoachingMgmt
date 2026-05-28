## ADDED Requirements

### Requirement: Teacher generates invite link
A VERIFIED teacher SHALL be able to generate an invite link for a specific course (group or 1-on-1 package). The link contains a unique short code. The teacher can share it via any channel.

#### Scenario: Teacher generates invite link
- **WHEN** teacher clicks "Generate invite link" for a course
- **THEN** invite_links record created with a unique 12-character code, expires_at set 30 days out

### Requirement: Invite link resolution
When a user visits /invite/[code], the system SHALL resolve the code to the linked course. If the user is unauthenticated, they are redirected to /login?return=/invite/[code]. After login or registration, they are redirected back and auto-enrolled.

#### Scenario: Authenticated user visits invite link
- **WHEN** an authenticated student visits a valid /invite/[code]
- **THEN** system auto-creates a booking for the linked course and redirects to booking confirmation

#### Scenario: Unauthenticated user visits invite link
- **WHEN** an unauthenticated user visits /invite/[code]
- **THEN** redirected to /login?return=/invite/[code]

#### Scenario: Expired invite code
- **WHEN** user visits /invite/[code] and expires_at is in the past
- **THEN** system returns a "link expired" page

### Requirement: Invite link usage tracking
The system SHALL increment uses_count on the invite_links row each time a booking is successfully created via the link.

#### Scenario: Link used
- **WHEN** a booking is created through an invite link
- **THEN** invite_links.uses_count increments by 1
