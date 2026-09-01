import { getUserRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { staffService } from '@/lib/services/staffService';

export default async function VerifyPage() {
  const role = await getUserRole();
  if (!role || role === 'STUDENT') redirect('/login');

  const { achievements, certifications } = await staffService.getVerificationQueues();

  return (
    <div className="space-y-12">
      <h1 className="text-3xl font-bold text-[#1a365d]">Verification Queue</h1>

      <section>
        <h2 className="text-xl font-bold text-gray-700 mb-4">Pending Achievements</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-sm font-semibold text-gray-600">
                <th className="p-4">Student</th>
                <th className="p-4">Event</th>
                <th className="p-4">Level</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {achievements.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No achievements to verify.</td></tr>
              ) : (
                achievements.map((ach: any) => (
                  <tr key={ach.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">{ach.students.name} ({ach.students.register_number})</td>
                    <td className="p-4">{ach.event_name}</td>
                    <td className="p-4">{ach.level}</td>
                    <td className="p-4 flex gap-2">
                      <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Verify</button>
                      <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">Reject</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-700 mb-4">Pending Certifications</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-sm font-semibold text-gray-600">
                <th className="p-4">Student</th>
                <th className="p-4">Course</th>
                <th className="p-4">Platform</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {certifications.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No certifications to verify.</td></tr>
              ) : (
                certifications.map((cert: any) => (
                  <tr key={cert.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">{cert.students.name} ({cert.students.register_number})</td>
                    <td className="p-4">{cert.course_name}</td>
                    <td className="p-4">{cert.platform}</td>
                    <td className="p-4 flex gap-2">
                      <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Verify</button>
                      <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">Reject</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
