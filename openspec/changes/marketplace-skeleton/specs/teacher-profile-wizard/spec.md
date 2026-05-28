## ADDED Requirements

### Requirement: Guided profile creation wizard
The system SHALL present profile creation as a sequential multi-step wizard. Steps in order: (1) basic info, (2) qualifications, (3) demo video, (4) social links, (5) review & submit. Teacher cannot skip steps. Each step is independently saveable as a draft.

#### Scenario: Step progression
- **WHEN** teacher completes and saves a step
- **THEN** system persists the data and advances to the next step

#### Scenario: Draft persistence
- **WHEN** teacher closes the browser mid-wizard and returns
- **THEN** wizard resumes at the last incomplete step with prior data pre-filled

### Requirement: Required profile fields
The system SHALL require name, phone, email, subjects (at least one), target_exams (at least one), qualifications (free text), and profile_photo_url before allowing submission. bio, teaching_experience_years, demo_video_link, and social_media_links are optional.

#### Scenario: Submit with missing required field
- **WHEN** teacher attempts to submit with any required field empty
- **THEN** system blocks submission and highlights the missing field

### Requirement: Teacher verification flow
On submission the teacher profile status SHALL be set to PENDING. Admin reviews and can APPROVE, REJECT (with reason), or REQUEST_MORE_INFO. REJECTED teachers can edit and resubmit unlimited times.

#### Scenario: Admin approves
- **WHEN** admin approves a PENDING profile
- **THEN** status becomes VERIFIED, teacher receives approval email, teacher can now create courses

#### Scenario: Admin rejects
- **WHEN** admin rejects with a reason
- **THEN** status becomes REJECTED, rejection_reason stored, teacher receives rejection email with reason

#### Scenario: Admin requests more info
- **WHEN** admin sets status to MORE_INFO_REQUESTED
- **THEN** teacher receives email prompting them to update specific fields; teacher can resubmit

#### Scenario: Teacher resubmits after rejection
- **WHEN** rejected teacher edits profile and resubmits
- **THEN** status resets to PENDING, admin sees it in verification queue again

### Requirement: Admin suspension
Admin SHALL be able to suspend a VERIFIED teacher at any time. Suspension hides all their courses from browse immediately.

#### Scenario: Teacher suspended
- **WHEN** admin suspends a teacher
- **THEN** teacher status becomes SUSPENDED, all their LISTED courses become invisible in public browse
