import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import YearSelector from './YearSelector';
import FeeSummary from './FeeSummary';
import PaymentHistory from './PaymentHistory';
import AddPaymentForm from './AddPaymentForm';

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const { year: selectedYear } = await searchParams;
  const currentYear = selectedYear || '2024-2025';

  const supabase = await createClient();

  // Fetch official fee structure (multiple rows now)
  const { data: feeStructures } = await supabase
    .from('fee_structures')
    .select('*')
    .eq('student_id', profile.student_id)
    .eq('academic_year', currentYear);


  // Fetch all payments for this student for the year
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', profile.student_id)
    .eq('academic_year', currentYear)
    .order('payment_date', { ascending: false });

  // Fetch student type/transport for applicability logic
  const { data: hostel } = await supabase
    .from('hostel_details')
    .select('accommodation_type')
    .eq('student_id', profile.student_id)
    .maybeSingle();

  const { data: transport } = await supabase
    .from('transport_details')
    .select('transport_type')
    .eq('student_id', profile.student_id)
    .maybeSingle();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d] mb-2">Fees & Payments</h1>
          <p className="text-gray-600">Track your official fee requirements and payment history.</p>
        </div>
        <YearSelector />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <FeeSummary
            feeStructure={feeStructures || []}
            payments={payments || []}
            hostelType={hostel?.accommodation_type}
            transportType={transport?.transport_type}
          />
          <PaymentHistory payments={payments || []} />
        </div>
        <div className="lg:col-span-1">
          <AddPaymentForm
            academicYear={currentYear}
            hostelType={hostel?.accommodation_type}
            transportType={transport?.transport_type}
          />
        </div>
      </div>
    </div>
  );
}
