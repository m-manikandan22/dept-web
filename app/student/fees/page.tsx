import { getUserRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/auth';
import { feeRepository } from '@/lib/repositories/feeRepository';
import { paymentRepository } from '@/lib/repositories/paymentRepository';

export default async function FeesPage() {
  const role = await getUserRole();
  if (role !== 'STUDENT') redirect('/login');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('student_id')
    .eq('user_id', user.id)
    .single();

  if (!profile?.student_id) return <div className="p-8 text-red-600">Profile not found.</div>;

  const fees = await feeRepository.getByStudent(profile.student_id);
  const payments = await paymentRepository.getByStudent(profile.student_id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-[#1a365d]">Fees & Payments</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-[#1a365d] mb-4">Fee Summary</h2>
          <div className="space-y-4">
            {fees.length === 0 ? (
              <p className="text-gray-500">No fee records found.</p>
            ) : (
              fees.map((fee: any, i) => (
                <div key={i} className="p-4 border border-gray-100 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{fee.fee_type} ({fee.academic_year})</div>
                    <div className="text-xs text-gray-500">Due: {fee.due_date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">₹{fee.total_amount}</div>
                    <div className={`text-xs font-bold ${fee.status === 'PAID' ? 'text-green-600' : 'text-red-600'}`}>
                      {fee.status || 'UNPAID'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-[#1a365d] mb-4">Payment History</h2>
          <div className="space-y-4">
            {payments.length === 0 ? (
              <p className="text-gray-500">No payments recorded.</p>
            ) : (
              payments.map((payment: any, i) => (
                <div key={i} className="p-4 border border-gray-100 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-semibold">Payment ID: {payment.id.substring(0, 8)}...</div>
                    <div className="text-xs text-gray-500">Date: {payment.payment_date} | Mode: {payment.mode}</div>
                  </div>
                  <div className="font-bold text-green-600">
                    + ₹{payment.amount}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
