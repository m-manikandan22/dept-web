import { getUserRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { studentRepository } from '@/lib/repositories/studentRepository';

export default async function DashboardPage() {
  const role = await getUserRole();
  if (!role) redirect('/login');

  // Mock stats for now, would normally call a stats service
  const stats = role === 'STUDENT'
    ? [
        { label: 'Academic Year', value: '2024-25' },
        { label: 'Current CGPA', value: '8.5' },
        { label: 'Attendance', value: '92%' },
        { label: 'Pending Fees', value: '₹0' },
      ]
    : [
        { label: 'Total Students', value: '320' },
        { label: 'Pending Verifications', value: '14' },
        { label: 'Total Batches', value: '8' },
        { label: 'Fee Defaults', value: '12' },
      ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#1a365d] mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="label text-gray-500 text-xs uppercase font-semibold">{stat.label}</div>
            <div className="value text-2xl font-bold text-[#1a365d] mt-2">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-[#1a365d] mb-4">Welcome back, {role}</h2>
        <p className="text-gray-600">
          Select a module from the sidebar to manage your records and information.
        </p>
      </div>
    </div>
  );
}
