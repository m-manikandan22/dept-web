import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AcademicsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const supabase = await createClient();
  const { data: records } = await supabase
    .from('academic_records')
    .select('*')
    .eq('student_id', profile.student_id)
    .order('semester', { ascending: true });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d] mb-2">Academic Information</h1>
          <p className="text-gray-600">View your official semester-wise performance and CGPA.</p>
        </div>
      </div>

      {records && records.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Academic Year</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Semester</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">SGPA</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">CGPA</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Backlogs</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-700">{record.academic_year}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{record.semester}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.sgpa || '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.cgpa || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{record.backlogs}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      record.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {record.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No academic records available</h3>
          <p className="text-gray-500 max-w-sm mx-auto">Official academic records are managed by the department office.</p>
        </div>
      )}
    </div>
  );
}
