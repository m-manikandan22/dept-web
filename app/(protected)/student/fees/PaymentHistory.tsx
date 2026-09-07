'use client';

import React from 'react';

interface Payment {
  payment_date: string;
  academic_year: string;
  fee_component: 'TUITION' | 'TRANSPORT' | 'HOSTEL';
  amount: number;
  payment_mode: 'CASH' | 'ONLINE' | 'DD';
  transaction_reference: string | null;
}

interface PaymentHistoryProps {
  payments: Payment[];
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
        <h3 className="text-xl font-bold text-[#1a365d] mb-4">Payment History</h3>
        <p className="text-gray-500">No payment records found for the selected year.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
      <h3 className="text-xl font-bold text-[#1a365d]">Payment History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr className="text-xs font-semibold text-gray-500 uppercase border-b">
              <th className="py-3 px-2">Date</th>
              <th className="py-3 px-2">Component</th>
              <th className="py-3 px-2 text-right">Amount</th>
              <th className="py-3 px-2">Mode</th>
              <th className="py-3 px-2">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map((payment, idx) => (
              <tr key={idx} className="text-sm hover:bg-gray-50 transition-colors">
                <td className="py-3 px-2 text-gray-600">
                  {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-3 px-2 font-medium text-gray-700">
                  {payment.fee_component.charAt(0) + payment.fee_component.slice(1).toLowerCase()}
                </td>
                <td className="py-3 px-2 text-right font-bold text-gray-900">
                  ₹{payment.amount.toLocaleString()}
                </td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    payment.payment_mode === 'ONLINE' ? 'bg-blue-100 text-blue-700' :
                    payment.payment_mode === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {payment.payment_mode}
                  </span>
                </td>
                <td className="py-3 px-2 text-xs text-gray-500 font-mono">
                  {payment.transaction_reference || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
