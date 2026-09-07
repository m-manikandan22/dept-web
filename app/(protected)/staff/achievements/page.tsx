import { createClient } from '@/lib/supabase/client';

export default async function StaffAchievementsPage() {
  const supabase = createClient();
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*, students(name, register_number)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#1a365d]">Student Achievements</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 font-semibold">Student</th>
              <th className="px-6 py-4 font-semibold">Event</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Position</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {achievements && achievements.length > 0 ? (
              achievements.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{a.students?.name}</div>
                    <div className="text-xs text-gray-500">{a.students?.register_number}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">{a.event_name}</td>
                  <td className="px-6 py-4">{a.category}</td>
                  <td className="px-6 py-4">{a.position}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No achievements recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
