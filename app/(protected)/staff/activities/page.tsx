import { createClient } from '@/lib/supabase/client';

export default async function StaffActivitiesPage() {
  const supabase = createClient();
  const { data: activities } = await supabase
    .from('activities')
    .select('*, students(name, register_number)')
    .order('date', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#1a365d]">Student Activities</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 font-semibold">Student</th>
              <th className="px-6 py-4 font-semibold">Activity</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activities && activities.length > 0 ? (
              activities.map((act: any) => (
                <tr key={act.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{act.students?.name}</div>
                    <div className="text-xs text-gray-500">{act.students?.register_number}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">{act.activity_name}</td>
                  <td className="px-6 py-4">{act.role}</td>
                  <td className="px-6 py-4">{act.date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No activities recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
