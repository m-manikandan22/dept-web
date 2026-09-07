import { createClient } from '@/lib/supabase/server';

export default async function ReportsPage() {
  const supabase = await createClient();

  // 1. Student Count
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });

  // 2. Academic Record Count
  const { count: academicCount } = await supabase
    .from('academic_records')
    .select('*', { count: 'exact', head: true });

  // 3. Total Payments
  const { data: payments } = await supabase
    .from('payments')
    .select('amount');

  const totalCollected = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  // 4. Achievement/Cert Distribution
  const { count: achievementCount } = await supabase
    .from('achievements')
    .select('*', { count: 'exact', head: true });

  const { count: certCount } = await supabase
    .from('certifications')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d]">Departmental Reports</h1>
          <p className="text-gray-600">Overview of data collection progress.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Export to PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Students</p>
          <p className="text-3xl font-bold text-[#1a365d]">{studentCount || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500 mb-1">Academic Records</p>
          <p className="text-3xl font-bold text-[#1a365d]">{academicCount || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Fees Collected</p>
          <p className="text-3xl font-bold text-green-600">₹{totalCollected.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500 mb-1">Certifications</p>
          <p className="text-3xl font-bold text-[#1a365d]">{certCount || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-[#1a365d] mb-4">Data Collection Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Achievements</span>
                <span>{achievementCount || 0} records</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min(((achievementCount || 0) / (studentCount || 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Certifications</span>
                <span>{certCount || 0} records</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min(((certCount || 0) / (studentCount || 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-[#1a365d] mb-4">Report Generation</h3>
          <div className="grid grid-cols-1 gap-3">
            <button className="text-left px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center">
              <span>Generate Master Student List (CSV)</span>
              <span className="text-gray-400">→</span>
            </button>
            <button className="text-left px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center">
              <span>Academic Performance Summary (PDF)</span>
              <span className="text-gray-400">→</span>
            </button>
            <button className="text-left px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center">
              <span>Financial Dues Report (Excel)</span>
              <span className="text-gray-400">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
