import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateStudentProfile } from '../actions';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const supabase = await createClient();

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', profile.student_id)
    .single();

  const { data: batches } = await supabase
    .from('batches')
    .select('id, name')
    .order('name');

  const { data: hostel } = await supabase
    .from('hostel_details')
    .select('*')
    .eq('student_id', profile.student_id)
    .maybeSingle();

  const { data: transport } = await supabase
    .from('transport_details')
    .select('*')
    .eq('student_id', profile.student_id)
    .maybeSingle();

  if (!student) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold text-red-600">Student Record Not Found</h1>
        <p>Your profile exists, but the linked student record is missing.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d] mb-2">My Profile</h1>
          <p className="text-gray-600">Verify and update your personal and academic identification.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
              {student.name ? student.name.charAt(0) : 'S'}
            </div>
            <h2 className="text-xl font-bold text-[#1a365d]">{student.name || 'Unknown Student'}</h2>
            <p className="text-sm text-gray-500">{student.register_number}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Department</span>
                <span className="font-medium text-gray-700">{student.department}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Semester</span>
                <span className="font-medium text-gray-700">{student.semester}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  {student.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Update Form */}
        <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-[#1a365d] mb-6">Update Personal Information</h3>
          <ProfileForm
            student={student}
            hostel={hostel}
            transport={transport}
            batches={batches || []}
          />
        </div>
      </div>
    </div>
  );
}
