## MODIFIED Requirements

### Requirement: Weekly availability grid
The system SHALL store teacher availability as a weekly grid. Each row has: teacher_id, day_of_week (MON/TUE/WED/THU/FRI/SAT/SUN), start_time (TIME), end_time (TIME), is_recurring (BOOLEAN), specific_date (DATE, nullable), status (AVAILABLE or BLOCKED).

Recurring rows (is_recurring = true) represent weekly standing availability. One-off overrides use specific_date with is_recurring = false. A BLOCKED row with specific_date overrides a recurring AVAILABLE row on that date.

#### Scenario: Teacher sets recurring availability
- **WHEN** teacher marks Monday 10:00–12:00 as available with is_recurring = true
- **THEN** TeacherAvailability row created; student slot picker shows this window every Monday

#### Scenario: Teacher blocks a specific date
- **WHEN** teacher adds a BLOCKED row for a specific_date that falls on a normally available weekday
- **THEN** the specific date is treated as unavailable in the slot picker

#### Scenario: Booked slot not available for re-booking
- **WHEN** a session is scheduled in a time window
- **THEN** that slot does not appear as available in the slot picker for other students
