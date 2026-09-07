import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { addCertification } from '../actions';

export default async function CertificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const supabase = await createClient();
  const { data: certifications } = await supabase
    .from('certifications')
    .select('*')
    .eq('student_id', profile.student_id)
    .order('completion_date', { ascending: false });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d] mb-2">Certifications</h1>
          <p className="text-gray-600">List your professional courses and certified skills.</p>
        </div>
      </div>

      {certifications && certifications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certifications.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-[#1a365d] text-lg">{item.course_name}</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium">Platform:</span>
                  <span>{item.platform || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Completed:</span>
                  <span>{item.completion_date || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Score:</span>
                  <span>{item.score || 'N/A'}</span>
                </div>
                {item.certificate_url && (
                  <a
                    href={item.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-3 text-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    View Certificate
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No certifications submitted yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto">Add your online courses and certifications to enhance your profile.</p>
        </div>
      )}

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-[#1a365d] mb-6">Submit New Certification</h3>
        <form action={addCertification} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="hidden" name="studentId" value={profile.student_id} />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Course Name *</label>
            <input
              type="text"
              name="courseName"
              required
              placeholder="e.g. Google Data Analytics"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Platform</label>
            <input
              type="text"
              name="platform"
              placeholder="e.g. Coursera, Udemy, edX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Completion Date</label>
            <input
              type="date"
              name="completionDate"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Score / Grade</label>
            <input
              type="text"
              name="score"
              placeholder="e.g. 95% or Grade A"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Certificate URL</label>
            <input
              type="url"
              name="certificateUrl"
              placeholder="https://..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Briefly describe the certification and key skills learned..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            ></textarea>
          </div>

          <div className="md:col-span-2 pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-[#1a365d] text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
            >
              Submit Certification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
