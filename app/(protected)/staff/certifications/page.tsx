import { createClient } from '@/lib/supabase/server';

export default async function StaffCertificationsPage() {
  const supabase = await createClient();
  const { data: certifications } = await supabase
    .from('certifications')
    .select('*, students(name, register_number)')
    .order('completion_date', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#1a365d]">Student Certifications</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 font-semibold">Student</th>
              <th className="px-6 py-4 font-semibold">Course</th>
              <th className="px-6 py-4 font-semibold">Platform</th>
              <th className="px-6 py-4 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {certifications && certifications.length > 0 ? (
              certifications.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{c.students?.name}</div>
                    <div className="text-xs text-gray-500">{c.students?.register_number}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">{c.course_name}</td>
                  <td className="px-6 py-4">{c.platform}</td>
                  <td className="px-6 py-4">{c.completion_date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No certifications recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
