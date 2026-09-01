import { getUserRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/auth';
import { achievementRepository } from '@/lib/repositories/achievementRepository';

export default async function AchievementsPage() {
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

  const achievements = await achievementRepository.getByStudent(profile.student_id);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#1a365d]">My Achievements</h1>
        <Link href="/student/achievements/submit" className="btn btn-primary">
          + Submit Achievement
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievements.length === 0 ? (
          <p className="text-gray-500 col-span-2">No achievements recorded yet.</p>
        ) : (
          achievements.map((ach: any, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative">
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  ach.verification_status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                  ach.verification_status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {ach.verification_status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#1a365d] mb-2">{ach.event_name}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Organizer:</span> {ach.organizer}</p>
                <p><span className="font-medium">Level:</span> {ach.level}</p>
                <p><span className="font-medium">Position:</span> {ach.position}</p>
                <p><span className="font-medium">Date:</span> {ach.event_date}</p>
              </div>
              <div className="mt-4 text-gray-700 text-sm">
                {ach.description}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
