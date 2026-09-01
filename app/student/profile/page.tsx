import { getUserRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { studentService } from '@/lib/services/studentService';
import { createClient } from '@/lib/auth';

export default async function ProfilePage() {
  const role = await getUserRole();
  if (!role) redirect('/login');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('student_id')
    .eq('user_id', user.id)
    .single();

  if (!profile?.student_id) {
    return <div className="p-8 text-red-600">Student profile not found.</div>;
  }

  // Get the register number from the student table first
  const { data: studentData } = await supabase
    .from('students')
    .select('register_number')
    .eq('id', profile.student_id)
    .single();

  if (!studentData) return <div className="p-8 text-red-600">Student record not found.</div>;

  const profileInfo = await studentService.getFullProfile(studentData.register_number);

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#1a365d] mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-gray-400">
            {profileInfo.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-[#1a365d]">{profileInfo.name}</h2>
          <p className="text-gray-500">{profileInfo.register_number}</p>
          <div className="mt-6 space-y-2 text-sm text-left">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Email:</span>
              <span className="font-medium">{profileInfo.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Phone:</span>
              <span className="font-medium">{profileInfo.phone}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Department:</span>
              <span className="font-medium">{profileInfo.department}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-[#1a365d] mb-4">Academic Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-xs text-gray-500 block uppercase">Batch</span>
                <span className="font-semibold">{profileInfo.batch}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-xs text-gray-500 block uppercase">Section</span>
                <span className="font-semibold">{profileInfo.section}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-xs text-gray-500 block uppercase">Semester</span>
                <span className="font-semibold">{profileInfo.semester}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-xs text-gray-500 block uppercase">Status</span>
                <span className="font-semibold">{profileInfo.status}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-[#1a365d] mb-4">Quick Links</h3>
            <div className="flex gap-4">
              <Link href="/student/academics" className="btn btn-primary text-sm">View Grades</Link>
              <Link href="/student/fees" className="btn btn-ghost text-sm">Payment History</Link>
              <Link href="/student/achievements" className="btn btn-ghost text-sm">My Achievements</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
