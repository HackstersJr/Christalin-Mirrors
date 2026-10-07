-- ==============================================================================
-- Migration: Add UPI, Cash & Total to ManualDailySales + Enable Cross-Branch Attendance
-- Safe for modern Supabase PostgreSQL 15+ (does not modify auth.users generated columns)
-- Run this in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Add UPI, Cash, and Total columns to ManualDailySales
ALTER TABLE public."ManualDailySales"
    ADD COLUMN IF NOT EXISTS "upi" numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "cash" numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "total" numeric DEFAULT 0;

-- Compute total for any existing rows: Total = UPI + Cash + Retail (or Service + Retail)
UPDATE public."ManualDailySales"
SET "total" = CASE 
    WHEN (COALESCE("upi", 0) + COALESCE("cash", 0)) > 0 
        THEN COALESCE("upi", 0) + COALESCE("cash", 0) + COALESCE("retail", 0)
    ELSE COALESCE("service", 0) + COALESCE("retail", 0)
END
WHERE "total" IS NULL OR "total" = 0;

-- Ensure index exists
CREATE INDEX IF NOT EXISTS "manual_daily_sales_branch_date_idx" 
    ON public."ManualDailySales" (branch, date);

-- 2. Add Punch In, Punch Out, Notes, and Editor Role to Attendance table
ALTER TABLE public."Attendance"
    ADD COLUMN IF NOT EXISTS "punchIn" text,
    ADD COLUMN IF NOT EXISTS "punchOut" text,
    ADD COLUMN IF NOT EXISTS "notes" text,
    ADD COLUMN IF NOT EXISTS "updatedBy" text;

CREATE INDEX IF NOT EXISTS "attendance_staff_date_idx" 
    ON public."Attendance" ("staffId", date);

-- 3. Row-Level Security: Ensure full read/write access for application users
ALTER TABLE public."ManualDailySales" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_manual_daily_sales" ON public."ManualDailySales";
DROP POLICY IF EXISTS "Allow all access to ManualDailySales" ON public."ManualDailySales";
CREATE POLICY "allow_all_manual_daily_sales"
    ON public."ManualDailySales"
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

ALTER TABLE public."Attendance" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_attendance" ON public."Attendance";
DROP POLICY IF EXISTS "branch_insert" ON public."Attendance";
DROP POLICY IF EXISTS "branch_read" ON public."Attendance";
DROP POLICY IF EXISTS "branch_update" ON public."Attendance";
CREATE POLICY "allow_all_attendance"
    ON public."Attendance"
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

ALTER TABLE public."Staff" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_staff" ON public."Staff";
DROP POLICY IF EXISTS "staff_read_all" ON public."Staff";
CREATE POLICY "allow_all_staff"
    ON public."Staff"
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

ALTER TABLE public."Expense" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_expense" ON public."Expense";
CREATE POLICY "allow_all_expense"
    ON public."Expense"
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
