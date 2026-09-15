-- Create ManualDailySales table for online persistence of manual daily salon sales
create table if not exists public."ManualDailySales" (
    id text primary key default gen_random_uuid()::text,
    branch text not null,
    date text not null,
    "clientCount" integer default 0,
    retail numeric default 0,
    service numeric default 0,
    notes text default '',
    "updatedAt" timestamp with time zone default now(),
    constraint "ManualDailySales_branch_date_key" unique (branch, date)
);

-- Index for speedy lookups by month and branch
create index if not exists "manual_daily_sales_branch_date_idx" on public."ManualDailySales" (branch, date);

-- Enable RLS and public access for read/write
alter table public."ManualDailySales" enable row level security;

drop policy if exists "Allow all access to ManualDailySales" on public."ManualDailySales";
create policy "Allow all access to ManualDailySales"
on public."ManualDailySales"
for all
using (true)
with check (true);
