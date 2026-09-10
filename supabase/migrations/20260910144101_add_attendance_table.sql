-- Attendance was previously localStorage-only on the frontend (see
-- Frontend/src/admin/data/store.ts attendanceStore) — marks made on one
-- device/browser never synced anywhere else. This adds a real table so
-- attendance is shared across branches/devices like every other resource.

create table public."Attendance" (
    id text primary key default gen_random_uuid()::text,
    "staffId" text not null references public."Staff"(id) on delete cascade,
    "staffName" text not null,
    "branchId" text not null references public."Branch"(id),
    date date not null,
    status text not null check (status in ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE')),
    "createdAt" timestamptz not null default now(),
    "updatedAt" timestamptz not null default now(),
    unique ("staffId", date)
);

alter table public."Attendance" enable row level security;

-- Any signed-in branch user can mark attendance; the app always sets
-- branchId from the current session, matching the Invoice table's pattern.
create policy "branch_insert" on public."Attendance"
    for insert
    to authenticated
    with check (true);

create policy "branch_read" on public."Attendance"
    for select
    to authenticated
    using (public.auth_role() = 'owner' or "branchId" = public.auth_branch_id());

create policy "branch_update" on public."Attendance"
    for update
    to authenticated
    using (public.auth_role() = 'owner' or "branchId" = public.auth_branch_id());

create index "attendance_date_idx" on public."Attendance" (date);
create index "attendance_branch_idx" on public."Attendance" ("branchId");
