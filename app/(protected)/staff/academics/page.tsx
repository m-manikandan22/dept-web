import { createClient } from '@/lib/supabase/server';

export default async function StaffAcademicsPage() {
  const supabase = await createClient();
  const { data: records } = await supabase
    .from('academic_records')
    .select('*, students(name, register_number)')
    .order('student_id');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#1a365d]">Academic Records Management</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 font-semibold">Student</th>
              <th className="px-6 py-4 font-semibold">Year</th>
              <th className="px-6 py-4 font-semibold">Sem</th>
              <th className="px-6 py-4 font-semibold">SGPA</th>
              <th className="px-6 py-4 font-semibold">CGPA</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records && records.length > 0 ? (
              records.map((rec: any) => (
                <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{rec.students?.name}</div>
                    <div className="text-xs text-gray-500">{rec.students?.register_number}</div>
                  </td>
                  <td className="px-6 py-4">{rec.academic_year}</td>
                  <td className="px-6 py-4">{rec.semester}</td>
                  <td className="px-6 py-4">{rec.sgpa || '-'}</td>
                  <td className="px-6 py-4">{rec.cgpa || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      rec.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {rec.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No academic records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
