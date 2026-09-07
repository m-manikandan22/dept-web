-- ============================================================================================
-- MIGRATION: 012_relax_student_profile_protections.sql
-- ============================================================================================
-- OBJECTIVE: Further relax student profile protections to allow editing of all fields
--            except for the core identity fields: id, register_number, and email.
-- ============================================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.protect_student_owned_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1;

    IF v_role = 'STUDENT' THEN
        -- IMMUTABLE FIELDS: Students strictly cannot change these.
        -- All other fields (name, phone, father_name, address, gender, batch_id, section, semester, etc.) are editable.
        IF NEW.id <> OLD.id
           OR NEW.register_number IS DISTINCT FROM OLD.register_number
           OR NEW.email IS DISTINCT FROM OLD.email THEN
            RAISE EXCEPTION 'Students cannot modify official identity fields (ID, Register Number, or Email).';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

COMMIT;
