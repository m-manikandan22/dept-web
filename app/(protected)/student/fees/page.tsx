import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import YearSelector from './YearSelector';
import FeeSummary from './FeeSummary';
import PaymentHistory from './PaymentHistory';
import FeeForm from './FeeForm';

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

  // Fetch applicable custom fees
  const { data: customFeeTypes } = await supabase
    .from('fee_types')
    .select('*')
    .eq('academic_year', currentYear)
    .filter('target_batch_id', 'is', null) // Simplification: handle complex targeting in a more robust way if needed
    // Note: Real targeting requires JS filter or complex SQL.
    // For now, we'll fetch all for the year and filter in JS.
    .order('name');

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

  // Filter custom fees based on targeting
  const filteredCustomFees = customFeeTypes?.filter(cf => {
    const batchMatch = !cf.target_batch_id || cf.target_batch_id === profile.batch_id; // Assuming batch_id is on profile
    const sectionMatch = !cf.target_section || cf.target_section === profile.section; // Assuming section is on profile
    const genderMatch = !cf.target_gender || cf.target_gender === profile.gender; // Assuming gender is on profile
    return batchMatch && sectionMatch && genderMatch;
  }) || [];

  // Compute initial data for the form
  const getSum = (component: string) =>
    payments?.filter(p => p.fee_component === component).reduce((sum, p) => sum + p.amount, 0) || 0;

  const getCustomSum = (feeTypeId: string) =>
    payments?.filter(p => p.fee_type_id === feeTypeId).reduce((sum, p) => sum + p.amount, 0) || 0;

  const structure = feeStructures?.[0] || {};

  const initialData = {
    student_type: hostel?.accommodation_type || 'DAY_SCHOLAR',
    transport_type: transport?.transport_type || 'OUTBUS',
    tuition_total: structure.tuition_fee || 0,
    tuition_paid: getSum('TUITION'),
    hostel_total: structure.hostel_fee || 0,
    hostel_paid: getSum('HOSTEL'),
    bus_total: structure.transport_fee || 0,
    bus_paid: getSum('TRANSPORT'),
    customFees: filteredCustomFees.map(cf => ({
      id: cf.id,
      name: cf.name,
      total: cf.amount,
      paid: getCustomSum(cf.id),
    })),
  };

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
          <FeeForm
            initialData={initialData}
            academicYear={currentYear}
            customFeeDefinitions={filteredCustomFees.map(cf => ({
              id: cf.id,
              name: cf.name,
              amount: cf.amount
            }))}
          />
        </div>
      </div>
    </div>
  );
}
