import { createClient } from '@/lib/supabase/server';

export default async function StaffPaymentsPage() {
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from('payments')
    .select('*, students(name, register_number)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#1a365d]">Payment Records</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 font-semibold">Student</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Component</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments && payments.length > 0 ? (
              payments.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{p.students?.name}</div>
                    <div className="text-xs text-gray-500">{p.students?.register_number}</div>
                  </td>
                  <td className="px-6 py-4">{p.payment_date}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {p.fee_component}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">₹{p.amount}</td>
                  <td className="px-6 py-4 font-mono text-xs">{p.transaction_reference}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No payment records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
