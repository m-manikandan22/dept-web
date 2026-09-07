-- 015_grant_service_role_full_privileges.sql
-- Grants the Supabase service_role full privileges on all tables.
-- This migration should be run once after provisioning the database.

-- Enable the service_role (the role used by the service‑role key) to bypass RLS.
-- It needs explicit privileges on every table that server‑side code accesses.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.batches TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_records TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_structures TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hostel_details TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transport_details TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO service_role;

-- Ensure future tables get the same privileges automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
