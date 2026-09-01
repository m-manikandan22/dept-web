-- 003_rls.sql
-- Row Level Security Policies

-- Enable RLS on all application tables
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get the user's role from the profiles table
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Helper function to get the associated student_id for the current user
CREATE OR REPLACE FUNCTION get_my_student_id()
RETURNS UUID AS $$
  SELECT student_id FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE;

-- 1. Batches: Read-only for all authenticated users
CREATE POLICY "Batches are viewable by all authenticated users"
ON batches FOR SELECT TO authenticated USING (true);

-- 2. Students
CREATE POLICY "Students can view their own profile"
ON students FOR SELECT TO authenticated
USING (id = get_my_student_id() OR get_my_role() IN ('STAFF', 'ADMIN'));

CREATE POLICY "Staff and Admin can manage students"
ON students FOR ALL TO authenticated
USING (get_my_role() IN ('STAFF', 'ADMIN'))
WITH CHECK (get_my_role() IN ('STAFF', 'ADMIN'));

-- 3. Staff
CREATE POLICY "Staff profiles are viewable by all authenticated users"
ON staff FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only Admin can manage staff"
ON staff FOR ALL TO authenticated
USING (get_my_role() = 'ADMIN')
WITH CHECK (get_my_role() = 'ADMIN');

-- 4. Profiles
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR get_my_role() = 'ADMIN');

CREATE POLICY "Only Admin can manage profiles"
ON profiles FOR ALL TO authenticated
USING (get_my_role() = 'ADMIN')
WITH CHECK (get_my_role() = 'ADMIN');

-- 5. Academic Records
CREATE POLICY "Students can view own records, Staff/Admin can view all"
ON academic_records FOR SELECT TO authenticated
USING (student_id = get_my_student_id() OR get_my_role() IN ('STAFF', 'ADMIN'));

CREATE POLICY "Staff and Admin can manage academic records"
ON academic_records FOR ALL TO authenticated
USING (get_my_role() IN ('STAFF', 'ADMIN'))
WITH CHECK (get_my_role() IN ('STAFF', 'ADMIN'));

-- 6. Fees
CREATE POLICY "Students can view own fees, Staff/Admin can view all"
ON fees FOR SELECT TO authenticated
USING (student_id = get_my_student_id() OR get_my_role() IN ('STAFF', 'ADMIN'));

CREATE POLICY "Staff and Admin can manage fees"
ON fees FOR ALL TO authenticated
USING (get_my_role() IN ('STAFF', 'ADMIN'))
WITH CHECK (get_my_role() IN ('STAFF', 'ADMIN'));

-- 7. Payments
CREATE POLICY "Students can view own payments, Staff/Admin can view all"
ON payments FOR SELECT TO authenticated
USING (student_id = get_my_student_id() OR get_my_role() IN ('STAFF', 'ADMIN'));

CREATE POLICY "Staff and Admin can manage payments"
ON payments FOR ALL TO authenticated
USING (get_my_role() IN ('STAFF', 'ADMIN'))
WITH CHECK (get_my_role() IN ('STAFF', 'ADMIN'));

-- 8. Hostel Details
CREATE POLICY "Students can view own hostel info, Staff/Admin can view all"
ON hostel_details FOR SELECT TO authenticated
USING (student_id = get_my_student_id() OR get_my_role() IN ('STAFF', 'ADMIN'));

CREATE POLICY "Staff and Admin can manage hostel info"
ON hostel_details FOR ALL TO authenticated
USING (get_my_role() IN ('STAFF', 'ADMIN'))
WITH CHECK (get_my_role() IN ('STAFF', 'ADMIN'));

-- 9. Transport Details
CREATE POLICY "Students can view own transport info, Staff/Admin can view all"
ON transport_details FOR SELECT TO authenticated
USING (student_id = get_my_student_id() OR get_my_role() IN ('STAFF', 'ADMIN'));

CREATE POLICY "Staff and Admin can manage transport info"
ON transport_details FOR ALL TO authenticated
USING (get_my_role() IN ('STAFF', 'ADMIN'))
WITH CHECK (get_my_role() IN ('STAFF', 'ADMIN'));

-- 10. Achievements
CREATE POLICY "Students can view own and submit achievements"
ON achievements FOR SELECT TO authenticated
USING (student_id = get_my_student_id() OR get_my_role() IN ('STAFF', 'ADMIN'));

CREATE POLICY "Students can insert their own achievements"
ON achievements FOR INSERT TO authenticated
WITH CHECK (student_id = get_my_student_id());

CREATE POLICY "Staff and Admin can manage achievements"
ON achievements FOR ALL TO authenticated
USING (get_my_role() IN ('STAFF', 'ADMIN'))
WITH CHECK (get_my_role() IN ('STAFF', 'ADMIN'));

-- 11. Certifications
CREATE POLICY "Students can view own and submit certifications"
ON certifications FOR SELECT TO authenticated
USING (student_id = get_my_student_id() OR get_my_role() IN ('STAFF', 'ADMIN'));

CREATE POLICY "Students can insert their own certifications"
ON certifications FOR INSERT TO authenticated
WITH CHECK (student_id = get_my_student_id());

CREATE POLICY "Staff and Admin can manage certifications"
ON certifications FOR ALL TO authenticated
USING (get_my_role() IN ('STAFF', 'ADMIN'))
WITH CHECK (get_my_role() IN ('STAFF', 'ADMIN'));

-- 12. Activities
CREATE POLICY "Students can view own activities, Staff/Admin can view all"
ON activities FOR SELECT TO authenticated
USING (student_id = get_my_student_id() OR get_my_role() IN ('STAFF', 'ADMIN'));

CREATE POLICY "Staff and Admin can manage activities"
ON activities FOR ALL TO authenticated
USING (get_my_role() IN ('STAFF', 'ADMIN'))
WITH CHECK (get_my_role() IN ('STAFF', 'ADMIN'));

-- 13. Audit Logs
CREATE POLICY "Only Staff and Admin can view audit logs"
ON audit_logs FOR SELECT TO authenticated
USING (get_my_role() IN ('STAFF', 'ADMIN'));

CREATE POLICY "Only system/admin can insert audit logs"
ON audit_logs FOR INSERT TO authenticated
WITH CHECK (get_my_role() IN ('STAFF', 'ADMIN'));

-- 14. Settings
CREATE POLICY "Settings are viewable by all authenticated users"
ON settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only Admin can manage settings"
ON settings FOR ALL TO authenticated
USING (get_my_role() = 'ADMIN')
WITH CHECK (get_my_role() = 'ADMIN');
