import { getUserRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { studentService } from '@/lib/services/studentService';
import Link from 'next/link';

export default async function StaffStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const role = await getUserRole();
  if (!role || role === 'STUDENT') redirect('/login');

  try {
    const profileInfo = await studentService.getFullProfileById(id);

    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#1a365d]">Student Profile</h1>
          <Link href="/staff/students" className="btn btn-ghost">Back to Directory</Link>
        </div>

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
              <h3 className="text-lg font-bold text-[#1a365d] mb-4">Achievements & Certifications</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-100 rounded-lg">
                    <h4 className="font-bold text-sm mb-2">Achievements ({profileInfo.achievements.length})</h4>
                    <ul className="text-xs space-y-1 text-gray-600">
                      {profileInfo.achievements.map((ach: any, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{ach.event_name}</span>
                          <span className="font-medium">{ach.verification_status}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-lg">
                    <h4 className="font-bold text-sm mb-2">Certifications ({profileInfo.certifications.length})</h4>
                    <ul className="text-xs space-y-1 text-gray-600">
                      {profileInfo.certifications.map((cert: any, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{cert.course_name}</span>
                          <span className="font-medium">{cert.verification_status}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return <div className="p-8 text-red-600">Error loading student profile: {error instanceof Error ? error.message : 'Unknown error'}</div>;
  }
}
