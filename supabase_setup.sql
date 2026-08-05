-- ============================================================================
-- SUPABASE MIGRATION: MULTI-TENANT UPGRADE
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Log in to your Supabase Dashboard (https://supabase.com).
-- 2. Go to your project, click on "SQL Editor" in the left menu.
-- 3. Click "New Query", paste this entire SQL script, and click "Run".
-- ============================================================================

-- 1. Create the Agencies (Tenants) Table
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_name TEXT NOT NULL,
    agency_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    subscription_status TEXT DEFAULT 'trial' NOT NULL, -- 'trial', 'active', 'past_due', 'canceled'
    subscription_end TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '14 days') NOT NULL
);

-- 2. Add agency_id to Technicians Table
ALTER TABLE public.technicians 
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Technician' NOT NULL,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. Add agency_id to Tickets Table
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL;

-- 4. Add agency_id to Attendance Table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL;

-- 5. Create Indexes for High Performance (Scales to 100,000+ users)
CREATE INDEX IF NOT EXISTS idx_technicians_agency_id ON public.technicians(agency_id);
CREATE INDEX IF NOT EXISTS idx_tickets_agency_id ON public.tickets(agency_id);
CREATE INDEX IF NOT EXISTS idx_attendance_agency_id ON public.attendance(agency_id);

-- 6. Seed a Default Agency for the existing "Pandit Glen Service" data
-- This ensures existing data is not lost.
INSERT INTO public.agencies (id, agency_name, agency_code, subscription_status)
VALUES (
    'd83d4789-9b48-4ca4-bb3e-bf6ea37785c4',
    'Pandit Glen Service',
    'PGLEN2025',
    'active'
) ON CONFLICT (agency_code) DO NOTHING;

-- Link all existing data to this default agency so your current setup continues working
UPDATE public.technicians SET agency_id = 'd83d4789-9b48-4ca4-bb3e-bf6ea37785c4' WHERE agency_id IS NULL;
UPDATE public.tickets SET agency_id = 'd83d4789-9b48-4ca4-bb3e-bf6ea37785c4' WHERE agency_id IS NULL;
UPDATE public.attendance SET agency_id = 'd83d4789-9b48-4ca4-bb3e-bf6ea37785c4' WHERE agency_id IS NULL;

-- 7. Row-Level Security (RLS) Configurations
-- Turn on RLS on tables to prevent agencies from seeing each other's data
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
