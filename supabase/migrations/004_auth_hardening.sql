-- 004_auth_hardening.sql
-- Fix RLS Recursion and Harden Authorization

-- 1. Fix RLS Recursion by using SECURITY DEFINER functions
-- These functions bypass RLS to avoid the circular dependency between get_my_role() and profiles RLS.

DROP FUNCTION IF EXISTS get_my_role();
DROP FUNCTION IF EXISTS get_my_student_id();

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_student_id()
RETURNS UUID AS $$
  SELECT student_id FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Harden Profiles table constraints
-- Ensure a student can only have one profile.
ALTER TABLE profiles ADD CONSTRAINT unique_student_id UNIQUE (student_id);
-- Ensure a user can only have one profile.
ALTER TABLE profiles ADD CONSTRAINT unique_user_id UNIQUE (user_id);

-- 3. Review and refine RLS policies to ensure students cannot modify their own roles or identities
-- Drop existing policies on profiles to redefine them clearly
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Only Admin can manage profiles" ON profiles;

-- Profiles: Users can view their own, Admins can manage all
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR get_my_role() = 'ADMIN');

CREATE POLICY "Only Admin can manage profiles"
ON profiles FOR ALL TO authenticated
USING (get_my_role() = 'ADMIN')
WITH CHECK (get_my_role() = 'ADMIN');

-- 4. Ensure that no other policies allow students to UPDATE their own profiles' role or student_id
-- Since the "Only Admin can manage profiles" policy is the only one allowing ALL/UPDATE,
-- students are already restricted from updating their own profiles unless they are ADMINs.
