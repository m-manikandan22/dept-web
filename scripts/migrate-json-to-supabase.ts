import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('Starting full migration...');

  const report = {
    records_read: 0,
    records_inserted: 0,
    records_skipped: 0,
    records_failed: 0,
    validation_errors: [],
  };

  const tables = [
    { name: 'batches', file: 'batches.json', map: (row: any) => ({ name: row.Batch }) },
    { name: 'students', file: 'students.json', map: async (row: any) => {
        const { data: b } = await supabase.from('batches').select('id').eq('name', row.Batch).single();
        return {
          register_number: row.RegisterNo,
          name: row.Name,
          batch_id: b?.data?.id,
          section: row.Section,
          email: row.Email,
          phone: row.Phone,
          gender: row.Gender,
          department: row.Department,
          semester: parseInt(row.Semester),
          status: row.Status,
        };
      }
    },
    { name: 'staff', file: 'staff.json', map: (row: any) => ({
        name: row.Name,
        email: row.Email,
        phone: row.Phone,
        role: row.Role,
        department: row.Department,
      })
    },
    { name: 'academic_records', file: 'academics.json', map: async (row: any) => {
        const { data: s } = await supabase.from('students').select('id').eq('register_number', row.RegisterNo).single();
        return {
          student_id: s?.data?.id,
          academic_year: row.AcademicYear,
          semester: parseInt(row.Semester),
          sgpa: parseFloat(row.SGPA),
          cgpa: parseFloat(row.CGPA),
          backlogs: parseInt(row.Backlogs),
          remarks: row.AcademicRemarks,
          status: row.AcademicStatus,
        };
      }
    },
    { name: 'fees', file: 'fees.json', map: async (row: any) => {
        const { data: s } = await supabase.from('students').select('id').eq('register_number', row.RegisterNo).single();
        return {
          student_id: s?.data?.id,
          academic_year: row.AcademicYear,
          semester: parseInt(row.Semester),
          fee_type: row.FeeType,
          total_amount: parseFloat(row.TotalAmount),
          due_date: row.DueDate,
          status: row.Status,
        };
      }
    },
    { name: 'payments', file: 'payments.json', map: async (row: any) => {
        const { data: s } = await supabase.from('students').select('id').eq('register_number', row.RegisterNo).single();
        const { data: f } = await supabase.from('fees').select('id').eq('FeeID', row.FeeID).single();
        return {
          student_id: s?.data?.id,
          fee_id: f?.data?.id,
          amount: parseFloat(row.Amount),
          payment_date: row.PaymentDate,
          mode: row.PaymentMode,
          reference: row.TransactionReference,
        };
      }
    },
    { name: 'hostel_details', file: 'hostel.json', map: async (row: any) => {
        const { data: s } = await supabase.from('students').select('id').eq('register_number', row.RegisterNo).single();
        return {
          student_id: s?.data?.id,
          accommodation_type: row.AccommodationType,
          hostel_name: row.HostelName,
          room_number: row.RoomNumber,
          hostel_fee: parseFloat(row.HostelFee),
          mess_fee: parseFloat(row.MessFee),
          status: row.Status,
        };
      }
    },
    { name: 'transport_details', file: 'transport.json', map: async (row: any) => {
        const { data: s } = await supabase.from('students').select('id').eq('register_number', row.RegisterNo).single();
        return {
          student_id: s?.data?.id,
          uses_bus: row.UsesCollegeBus === 'true' || row.UsesCollegeBus === true,
          route: row.Route,
          bus_number: row.BusNumber,
          transport_fee: parseFloat(row.TransportFee),
          status: row.Status,
        };
      }
    },
    { name: 'achievements', file: 'achievements.json', map: async (row: any) => {
        const { data: s } = await supabase.from('students').select('id').eq('register_number', row.RegisterNo).single();
        return {
          student_id: s?.data?.id,
          category: row.Category,
          event_name: row.EventName,
          organizer: row.Organizer,
          event_date: row.EventDate,
          level: row.Level,
          position: row.Position,
          description: row.Description,
          proof_reference: row.ProofReference,
          verification_status: row.VerificationStatus,
        };
      }
    },
    { name: 'certifications', file: 'certifications.json', map: async (row: any) => {
        const { data: s } = await supabase.from('students').select('id').eq('register_number', row.RegisterNo).single();
        return {
          student_id: s?.data?.id,
          course_name: row.CourseName,
          platform: row.Platform,
          completion_date: row.CompletionDate,
          score: row.Score,
          certificate_url: row.CertificateURL,
          proof_reference: row.ProofReference,
          verification_status: row.VerificationStatus,
        };
      }
    },
  ];

  for (const table of tables) {
    console.log(`Migrating ${table.name}...`);
    try {
      const data = JSON.parse(fs.readFileSync(`./data/${table.file}`, 'utf8'));
      for (const row of data) {
        report.records_read++;
        const mapped = await table.map(row);
        const { error } = await supabase.from(table.name).insert(mapped);
        if (error) {
          report.records_failed++;
          report.validation_errors.push(`${table.name} error: ${error.message}`);
        } else {
          report.records_inserted++;
        }
      }
    } catch (e) {
      console.error(`Skipping ${table.name}: ${e.message}`);
    }
  }

  console.log('Migration complete.');
  fs.writeFileSync('migration_report.json', JSON.stringify(report, null, 2));
}

migrate();
