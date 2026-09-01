-- 002_indexes.sql
-- Indexes for performance optimization

-- Students search and filtering
CREATE INDEX idx_students_register_number ON students(register_number);
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_students_batch_id ON students(batch_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_status ON students(status);

-- Academic records lookups
CREATE INDEX idx_academic_student_year ON academic_records(student_id, academic_year);

-- Fees and Payments lookups
CREATE INDEX idx_fees_student ON fees(student_id);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_fee_id ON payments(fee_id);

-- Achievement and Certification verification
CREATE INDEX idx_achievements_verification ON achievements(verification_status);
CREATE INDEX idx_certifications_verification ON certifications(verification_status);

-- Audit log searches
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_register_no ON audit_logs(register_number);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
