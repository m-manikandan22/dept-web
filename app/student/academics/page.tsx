import { getUserRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/auth';
import { academicRepository } from '@/lib/repositories/academicRepository';

export default async function AcademicsPage() {
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

  const records = await academicRepository.getByStudent(profile.student_id);

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#1a365d] mb-8">Academic Records</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-gray-600 text-sm font-semibold">
              <th className="p-4">Academic Year</th>
              <th className="p-4">Semester</th>
              <th className="p-4">SGPA</th>
              <th className="p-4">CGPA</th>
              <th className="p-4">Backlogs</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No academic records found.</td>
              </tr>
            ) : (
              records.map((rec: any, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4">{rec.academic_year}</td>
                  <td className="p-4">{rec.semester}</td>
                  <td className="p-4 font-bold">{rec.sgpa}</td>
                  <td className="p-4 font-bold text-[#1a365d]">{rec.cgpa}</td>
                  <td className="p-4">{rec.backlogs}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      rec.status === 'PROMOTED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {rec.status || 'PENDING'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
