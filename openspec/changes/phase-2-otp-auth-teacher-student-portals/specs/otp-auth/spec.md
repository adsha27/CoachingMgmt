## ADDED Requirements

### Requirement: OTP request
The system SHALL accept a registered email address and send a 6-digit numeric OTP code to that address. The code SHALL expire after 10 minutes. The system SHALL reject more than 5 OTP requests per email within any 15-minute window.

#### Scenario: Successful OTP request
- **WHEN** a user submits a registered email via `POST /api/auth/otp/request`
- **THEN** a 6-digit code is generated, stored as a bcrypt hash in `otp_codes` with `expiresAt = now + 10 min`, and a Resend email is sent to the address; response is `{ ok: true }` (no code in response body)

#### Scenario: Unknown email
- **WHEN** a user submits an email not found in the `users` table
- **THEN** the endpoint returns `{ ok: true }` (no enumeration — same response as success)

#### Scenario: Rate limit exceeded
- **WHEN** a user submits more than 5 OTP requests for the same email within 15 minutes
- **THEN** the endpoint returns HTTP 429 with `{ error: "Too many requests" }`

---

### Requirement: OTP verification
The system SHALL verify a submitted OTP code, issue a session cookie on success, and mark the code as used.

#### Scenario: Valid code
- **WHEN** a user submits a valid, unexpired, unused code via `POST /api/auth/otp/verify`
- **THEN** the code is marked `usedAt = now`, a `user_sessions` row is created (`expiresAt = now + 14 days`), and an httpOnly `sid` cookie is set in the response; user is redirected to their role-appropriate dashboard

#### Scenario: Expired code
- **WHEN** a user submits a code whose `expiresAt` is in the past
- **THEN** the endpoint returns HTTP 400 with `{ error: "Code expired" }`

#### Scenario: Already-used code
- **WHEN** a user submits a code that has already been used (`usedAt` is not null)
- **THEN** the endpoint returns HTTP 400 with `{ error: "Code already used" }`

#### Scenario: Wrong code
- **WHEN** a user submits a code that does not match the stored hash
- **THEN** the endpoint returns HTTP 400 with `{ error: "Invalid code" }`

---

### Requirement: Session validation
The system SHALL authenticate protected routes by reading the `sid` cookie and looking up the session in `user_sessions`.

#### Scenario: Valid session
- **WHEN** a request arrives at a protected route with a valid, unexpired `sid` cookie
- **THEN** the user's `id` and `role` are available to the handler and the request proceeds

#### Scenario: Missing or expired session
- **WHEN** a request arrives at a protected route with no `sid` cookie or an expired session
- **THEN** middleware redirects the request to `/login`

---

### Requirement: Logout
The system SHALL clear the session on logout.

#### Scenario: Logout clears session
- **WHEN** a user calls `POST /api/auth/logout`
- **THEN** the `user_sessions` row is deleted, the `sid` cookie is cleared (maxAge=0), and the response redirects to `/login`

---

### Requirement: Role-based post-login redirect
The system SHALL route users to the correct dashboard after login based on their `role`.

#### Scenario: Teacher login
- **WHEN** OTP verification succeeds and the user's role is `TEACHER`
- **THEN** the response redirects to `/teacher/dashboard`

#### Scenario: Student login
- **WHEN** OTP verification succeeds and the user's role is `STUDENT`
- **THEN** the response redirects to `/student/dashboard`

#### Scenario: Admin login
- **WHEN** OTP verification succeeds and the user's role is `ADMIN`
- **THEN** the response redirects to `/admin`
