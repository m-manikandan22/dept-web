-- ============================================================================================
-- MIGRATION: 010_update_student_profile_editability.sql
-- ============================================================================================
-- OBJECTIVE: Adjust student profile protection to allow self-editing of personal details
--            while maintaining strict immutability of official identity and security fields.
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
        -- IMMUTABLE FIELDS: Students cannot change these.
        -- Allowed to change: name, father_name, address, phone, gender.
        IF NEW.id <> OLD.id
           OR NEW.register_number IS DISTINCT FROM OLD.register_number
           OR NEW.email IS DISTINCT FROM OLD.email
           OR NEW.batch_id IS DISTINCT FROM OLD.batch_id
           OR NEW.section IS DISTINCT FROM OLD.section
           OR NEW.department IS DISTINCT FROM OLD.department
           OR NEW.semester IS DISTINCT FROM OLD.semester
           OR NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Students cannot modify official student identity or administrative fields.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

COMMIT;
