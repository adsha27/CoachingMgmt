## ADDED Requirements

### Requirement: Student proposes next session slot
After a 1-on-1 session is COMPLETED and sessions_remaining > 0, the student SHALL be able to propose a next session time by selecting from the teacher's available slots. The proposal is stored with status PENDING.

#### Scenario: Student proposes a slot
- **WHEN** student selects an available slot and submits
- **THEN** SlotProposal created with status PENDING, teacher receives email notification

#### Scenario: No remaining sessions
- **WHEN** student tries to propose a slot with sessions_remaining = 0
- **THEN** system returns 400, no proposal created

### Requirement: Teacher responds to slot proposal
Teacher SHALL be able to CONFIRM or REJECT a PENDING slot proposal. On CONFIRM: a new Session is created with a Meet link. On REJECT: teacher may provide an alternative time suggestion in teacher_note.

#### Scenario: Teacher confirms slot
- **WHEN** teacher confirms a PENDING slot proposal
- **THEN** proposal status = CONFIRMED, new Session created with Meet link, student receives confirmation email

#### Scenario: Teacher rejects with counter-proposal
- **WHEN** teacher rejects and sets teacher_note with an alternative time
- **THEN** proposal status = REJECTED, student receives rejection email with teacher's note suggesting an alternative

### Requirement: Only one pending proposal per booking
The system SHALL reject a new slot proposal if the booking already has an open PENDING proposal.

#### Scenario: Duplicate pending proposal
- **WHEN** student submits a proposal while one is already PENDING
- **THEN** system returns 409
