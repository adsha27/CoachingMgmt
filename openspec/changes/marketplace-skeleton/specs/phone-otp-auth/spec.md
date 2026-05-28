## ADDED Requirements

### Requirement: Phone OTP request
The system SHALL send a 6-digit OTP to a phone number via MSG91 when requested. The system SHALL rate-limit to 3 OTP requests per phone per hour. The OTP SHALL expire after 10 minutes.

#### Scenario: Successful OTP request
- **WHEN** a user submits a valid phone number
- **THEN** the system sends an OTP via MSG91 and returns 200

#### Scenario: Rate limit exceeded
- **WHEN** a phone has already received 3 OTPs in the current hour
- **THEN** the system returns 429 and does not send an OTP

### Requirement: Phone OTP verification
The system SHALL verify the submitted OTP against the stored bcrypt hash. After 5 consecutive failed attempts the phone SHALL be locked out for 1 hour.

#### Scenario: Correct OTP — existing user
- **WHEN** user submits the correct OTP and the phone exists in users
- **THEN** system creates a UserSession, returns a JWT access token (1h) and sets a refresh token cookie (30d, httpOnly, one-time use)

#### Scenario: Correct OTP — new user
- **WHEN** user submits the correct OTP and the phone does not exist in users
- **THEN** system returns a `needs_registration: true` flag and a short-lived registration token; user must supply name, email, role to complete account creation

#### Scenario: Incorrect OTP
- **WHEN** user submits a wrong OTP
- **THEN** system increments `failedAttempts`, returns 401

#### Scenario: Lockout after 5 failures
- **WHEN** failedAttempts reaches 5
- **THEN** system invalidates the OTP code and returns 423 for subsequent attempts until lockout expires

### Requirement: JWT refresh
The system SHALL issue a new access token when a valid refresh token is presented. Refresh tokens are one-time use — each use rotates to a new token.

#### Scenario: Valid refresh token
- **WHEN** client presents a valid, unused refresh token
- **THEN** system issues a new access token and rotates the refresh token

#### Scenario: Reused refresh token
- **WHEN** client presents an already-used refresh token
- **THEN** system returns 401 and invalidates all sessions for that user (token theft signal)

### Requirement: Logout
The system SHALL delete the UserSession row on logout, invalidating all further requests using that session.

#### Scenario: Logout
- **WHEN** authenticated user calls POST /api/auth/logout
- **THEN** UserSession is deleted, cookies cleared, returns 200

### Requirement: Role-based access
The system SHALL enforce role-based route access. TEACHER routes are inaccessible to STUDENT and vice versa. ADMIN routes are inaccessible to all non-ADMIN users.

#### Scenario: Wrong role
- **WHEN** a STUDENT accesses /teacher/* routes
- **THEN** middleware returns 403
