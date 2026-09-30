-- Migration: Add Punch In, Punch Out, Notes, and UpdatedBy to public."Attendance" table
-- Supports punch timing tracking, owner overrides, and bulk CSV imports

alter table public."Attendance"
    add column if not exists "punchIn" text,
    add column if not exists "punchOut" text,
    add column if not exists "notes" text,
    add column if not exists "updatedBy" text;

-- Performance index for staff attendance lookups
create index if not exists "attendance_staff_date_idx" on public."Attendance" ("staffId", date);

-- Optional: Ensure RLS policy allows owners to insert/update any date's attendance
-- while branch users can insert/update today's attendance
comment on column public."Attendance"."punchIn" is 'Punch-in time (e.g. 09:30 AM or 09:30)';
comment on column public."Attendance"."punchOut" is 'Punch-out time (e.g. 06:45 PM or 18:45)';
comment on column public."Attendance"."notes" is 'Shift or override notes';
comment on column public."Attendance"."updatedBy" is 'Role or user identifier who last edited this record';
