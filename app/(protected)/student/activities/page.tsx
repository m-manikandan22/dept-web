import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { addActivity } from '../actions';

export default async function ActivitiesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const supabase = await createClient();
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('student_id', profile.student_id)
    .order('date', { ascending: false });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d] mb-2">Activities & Engagement</h1>
          <p className="text-gray-600">Record your involvement in clubs, volunteering, and college events.</p>
        </div>
      </div>

      {activities && activities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-[#1a365d] text-lg">{item.activity_name}</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  Activity
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium">Role:</span>
                  <span>{item.role || 'Participant'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date:</span>
                  <span>{item.date || 'N/A'}</span>
                </div>
                {item.description && (
                  <p className="mt-3 p-3 bg-gray-50 rounded-lg italic text-gray-500">
                    &quot;{item.description}&quot;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No activities submitted yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto">Add your co-curricular activities to show your all-around development.</p>
        </div>
      )}

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-[#1a365d] mb-6">Add New Activity</h3>
        <form action={addActivity} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="hidden" name="studentId" value={profile.student_id} />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Activity Name *</label>
            <input
              type="text"
              name="activityName"
              required
              placeholder="e.g. NSS Volunteering, IEEE Workshop"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Your Role</label>
            <input
              type="text"
              name="role"
              placeholder="e.g. Coordinator, Participant, Lead"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Describe your contribution and what you achieved..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            ></textarea>
          </div>

          <div className="md:col-span-2 pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-[#1a365d] text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
            >
              Submit Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
