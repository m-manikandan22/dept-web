import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('Starting full migration...');

  const report = {
    records_read: 0,
    records_inserted: 0,
    records_skipped: 0,
    records_failed: 0,
    validation_errors: [] as string[],
  };

  // =========================================================
  // 1. SIMPLE TABLES (Row-by-Row)
  // =========================================================
  const simpleTables = [
    { name: 'batches', file: 'batches.json', map: (row: any) => ({ name: row.Batch }) },
    { name: 'students', file: 'students.json', map: async (row: any) => {
        const { data: b } = await supabase.from('batches').select('id').eq('name', row.Batch).single();
        return {
          register_number: row.RegisterNo,
          name: row.Name,
          batch_id: b?.id,
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
          student_id: s?.id,
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
    { name: 'hostel_details', file: 'hostel.json', map: async (row: any) => {
        const { data: s } = await supabase.from('students').select('id').eq('register_number', row.RegisterNo).single();
        return {
          student_id: s?.id,
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
          student_id: s?.id,
          transport_type: row.UsesCollegeBus === 'true' || row.UsesCollegeBus === true ? 'COLLEGE_BUS' : 'OUTBUS',
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
          student_id: s?.id,
          category: row.Category,
          event_name: row.EventName,
          organizer: row.Organizer,
          event_date: row.EventDate,
          level: row.Level,
          position: row.Position,
          description: row.Description,
        };
      }
    },
    { name: 'certifications', file: 'certifications.json', map: async (row: any) => {
        const { data: s } = await supabase.from('students').select('id').eq('register_number', row.RegisterNo).single();
        return {
          student_id: s?.id,
          course_name: row.CourseName,
          platform: row.Platform,
          completion_date: row.CompletionDate,
          score: row.Score,
          certificate_url: row.CertificateURL,
        };
      }
    },
    { name: 'activities', file: 'activities.json', map: async (row: any) => {
        const { data: s } = await supabase.from('students').select('id').eq('register_number', row.RegisterNo).single();
        return {
          student_id: s?.id,
          activity_name: row.ActivityName,
          date: row.Date,
          role: row.Role,
          description: row.Description,
        };
      }
    },
  ];

  for (const table of simpleTables) {
    console.log(`Migrating ${table.name}...`);
    try {
      const data = JSON.parse(fs.readFileSync(`./data/${table.file}`, 'utf8'));
      for (const row of data) {
        report.records_read++;
        const mapped = await table.map(row);
        const { error } = await supabase.from(table.name).insert(mapped as any);
        if (error) {
          report.records_failed++;
          report.validation_errors.push(`${table.name} error: ${error.message}`);
        } else {
          report.records_inserted++;
        }
      }
    } catch (e: any) {
      console.error(`Skipping ${table.name}: ${e.message}`);
    }
  }

  // =========================================================
  // 2. FEE AGGREGATION
  // =========================================================
  console.log('Migrating fee_structures (aggregating)...');
  try {
    const feeData = JSON.parse(fs.readFileSync('./data/fees.json', 'utf8'));
    const aggregatedFees = new Map<string, any>();

    for (const row of feeData) {
      report.records_read++;
      const { data: s } = await supabase.from('students').select('id').eq('register_number', row.RegisterNo).single();

      if (!s) {
        report.records_failed++;
        report.validation_errors.push(`fees: Student not found for ${row.RegisterNo}`);
        continue;
      }

      const key = `${s.id}_${row.AcademicYear}`;
      const current = aggregatedFees.get(key) || {
        student_id: s.id,
        academic_year: row.AcademicYear,
        tuition_fee: 0,
        transport_fee: 0,
        hostel_fee: 0,
      };

      const amount = parseFloat(row.TotalAmount);
      if (row.FeeType === 'TUITION') current.tuition_fee = amount;
      else if (row.FeeType === 'TRANSPORT') current.transport_fee = amount;
      else if (row.FeeType === 'HOSTEL') current.hostel_fee = amount;

      aggregatedFees.set(key, current);
    }

    for (const feeRecord of Array.from(aggregatedFees.values())) {
      const { error } = await supabase
        .from('fee_structures')
        .upsert(feeRecord, { onConflict: 'student_id,academic_year' });

      if (error) {
        report.records_failed++;
        report.validation_errors.push(`fee_structures upsert error: ${error.message}`);
      } else {
        report.records_inserted++;
      }
    }
  } catch (e: any) {
    console.error(`Skipping fee_structures: ${e.message}`);
  }

  // =========================================================
  // 3. PAYMENT MIGRATION
  // =========================================================
  console.log('Migrating payments...');
  try {
    const paymentData = JSON.parse(fs.readFileSync('./data/payments.json', 'utf8'));
    for (const row of paymentData) {
      report.records_read++;
      const { data: s } = await supabase.from('students').select('id').eq('register_number', row.RegisterNo).single();

      if (!s) {
        report.records_failed++;
        report.validation_errors.push(`payments: Student not found for ${row.RegisterNo}`);
        continue;
      }

      const component = row.FeeType;
      if (!component) {
        report.records_failed++;
        report.validation_errors.push(`payments: Record for ${row.RegisterNo} missing FeeType - requires manual mapping`);
        continue;
      }

      const mappedPayment = {
        student_id: s.id,
        academic_year: row.AcademicYear,
        fee_component: component,
        amount: parseFloat(row.Amount),
        payment_date: row.PaymentDate,
        payment_mode: row.PaymentMode,
        transaction_reference: row.TransactionReference,
      };

      const { error } = await supabase.from('payments').insert(mappedPayment);
      if (error) {
        report.records_failed++;
        report.validation_errors.push(`payments error: ${error.message}`);
      } else {
        report.records_inserted++;
      }
    }
  } catch (e: any) {
    console.error(`Skipping payments: ${e.message}`);
  }

  console.log('Migration complete.');
  fs.writeFileSync('migration_report.json', JSON.stringify(report, null, 2));
}

migrate();
