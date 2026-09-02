import { getUserRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/auth';
import { certificationRepository } from '@/lib/repositories/certificationRepository';

export default async function CertificationsPage() {
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

  const certifications = await certificationRepository.getByStudent(profile.student_id);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#1a365d]">My Certifications</h1>
        <Link href="/student/certifications/submit" className="btn btn-primary">
          + Submit Certification
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certifications.length === 0 ? (
          <p className="text-gray-500 col-span-2">No certifications recorded yet.</p>
        ) : (
          certifications.map((cert: any, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative">
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  cert.verification_status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                  cert.verification_status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {cert.verification_status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#1a365d] mb-2">{cert.course_name}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Platform:</span> {cert.platform}</p>
                <p><span className="font-medium">Score:</span> {cert.score}</p>
                <p><span className="font-medium">Date:</span> {cert.completion_date}</p>
              </div>
              {cert.certificate_url && (
                <a href={cert.certificate_url} target="_blank" className="mt-4 inline-block text-blue-600 hover:underline text-sm font-medium">
                  View Certificate →
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
