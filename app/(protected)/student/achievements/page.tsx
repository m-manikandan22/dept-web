import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { addAchievement } from '../actions';

export default async function AchievementsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const supabase = await createClient();
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('student_id', profile.student_id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d] mb-2">Achievements</h1>
          <p className="text-gray-600">Showcase your awards, hackathons, and competitive wins.</p>
        </div>
      </div>

      {achievements && achievements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-[#1a365d] text-lg">{item.event_name}</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium">Organizer:</span>
                  <span>{item.organizer || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Level:</span>
                  <span>{item.level || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Position:</span>
                  <span>{item.position || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date:</span>
                  <span>{item.event_date || 'N/A'}</span>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No achievements submitted yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto">Add your wins and accolades to build your professional profile.</p>
        </div>
      )}

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-[#1a365d] mb-6">Submit New Achievement</h3>
        <form action={addAchievement} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="hidden" name="studentId" value={profile.student_id} />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Event Name *</label>
            <input
              type="text"
              name="eventName"
              required
              placeholder="e.g. Smart India Hackathon"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select
              name="category"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Category</option>
              <option value="Sports">Sports</option>
              <option value="Games">Games</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Paper Presentation">Paper Presentation</option>
              <option value="Coding Competition">Coding Competition</option>
              <option value="Project Competition">Project Competition</option>
              <option value="Symposium">Symposium</option>
              <option value="Workshop">Workshop</option>
              <option value="Technical Event">Technical Event</option>
              <option value="Cultural Event">Cultural Event</option>
              <option value="Club Activity">Club Activity</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Organizer</label>
            <input
              type="text"
              name="organizer"
              placeholder="e.g. Ministry of Education"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Event Date</label>
            <input
              type="date"
              name="eventDate"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Level</label>
            <select
              name="level"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Level</option>
              <option value="National">National</option>
              <option value="State">State</option>
              <option value="College">College</option>
              <option value="International">International</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Position</label>
            <input
              type="text"
              name="position"
              placeholder="e.g. First Prize / Finalist"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Briefly describe your role and the achievement..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            ></textarea>
          </div>

          <div className="md:col-span-2 pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-[#1a365d] text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
            >
              Submit Achievement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
