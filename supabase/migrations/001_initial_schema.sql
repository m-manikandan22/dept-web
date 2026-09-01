-- 001_initial_schema.sql
-- Initial schema for IIDS Student Portal

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Batches
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Students
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    register_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    section TEXT,
    email TEXT,
    phone TEXT,
    gender TEXT,
    department TEXT,
    semester INTEGER,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Staff
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Profiles (Linking Supabase Auth to App Roles)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('STUDENT', 'STAFF', 'ADMIN')),
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Academic Records
CREATE TABLE academic_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    semester INTEGER NOT NULL,
    sgpa DECIMAL(3, 2),
    cgpa DECIMAL(3, 2),
    backlogs INTEGER DEFAULT 0,
    remarks TEXT,
    status TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (student_id, academic_year, semester)
);

-- 6. Fees
CREATE TABLE fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    semester INTEGER NOT NULL,
    fee_type TEXT NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    due_date DATE,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_id UUID REFERENCES fees(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    mode TEXT,
    reference TEXT,
    recorded_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Hostel Details
CREATE TABLE hostel_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    accommodation_type TEXT CHECK (accommodation_type IN ('Hosteller', 'Day Scholar')),
    hostel_name TEXT,
    room_number TEXT,
    hostel_fee DECIMAL(12, 2),
    mess_fee DECIMAL(12, 2),
    status TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Transport Details
CREATE TABLE transport_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    uses_bus BOOLEAN DEFAULT false,
    route TEXT,
    bus_number TEXT,
    transport_fee DECIMAL(12, 2),
    status TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Achievements
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    category TEXT,
    event_name TEXT NOT NULL,
    organizer TEXT,
    event_date DATE,
    level TEXT,
    position TEXT,
    description TEXT,
    proof_reference TEXT,
    verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    verified_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Certifications
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_name TEXT NOT NULL,
    platform TEXT,
    completion_date DATE,
    score TEXT,
    certificate_url TEXT,
    proof_reference TEXT,
    verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    verified_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Activities
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    activity_name TEXT NOT NULL,
    date DATE,
    role TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    role TEXT,
    action TEXT NOT NULL,
    module TEXT,
    record_id UUID,
    register_number TEXT,
    old_value JSONB,
    new_value JSONB,
    result TEXT,
    remarks TEXT
);

-- 14. Settings
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT
);
