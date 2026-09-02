-- 005_fix_permissions.sql
-- Fix database permission errors for the service_role

-- The service_role must have access to the students table for registration verification
GRANT SELECT ON TABLE public.students TO service_role;

-- The service_role must have access to the profiles table for account creation and management
GRANT ALL ON TABLE public.profiles TO service_role;

-- The service_role must have access to batches and staff for administrative operations
GRANT SELECT ON TABLE public.batches TO service_role;
GRANT SELECT ON TABLE public.staff TO service_role;

-- Ensure the tables are owned by the postgres user to avoid permission issues
ALTER TABLE public.students OWNER TO postgres;
ALTER TABLE public.profiles OWNER TO postgres;
ALTER TABLE public.batches OWNER TO postgres;
ALTER TABLE public.staff OWNER TO postgres;
