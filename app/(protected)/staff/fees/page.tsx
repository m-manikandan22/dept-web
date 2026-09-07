import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

async function updateFeeStructure(formData: FormData) {
  const adminSupabase = createAdminClient();
  const studentId = formData.get('studentId') as string;
  const academicYear = formData.get('academicYear') as string;

  const updates = {
    tuition_fee: parseFloat(formData.get('tuitionFee') as string || '0'),
    transport_fee: parseFloat(formData.get('transportFee') as string || '0'),
    hostel_fee: parseFloat(formData.get('hostelFee') as string || '0'),
    updated_at: new Date().toISOString(),
  };

  const { error } = await adminSupabase
    .from('fee_structures')
    .upsert({
      student_id: studentId,
      academic_year: academicYear,
      ...updates,
    }, { onConflict: 'student_id,academic_year' });

  if (error) throw error;
  revalidatePath('/staff/fees');
}

export default async function FeesManagementPage() {
  const supabase = createClient();

  // Fetch all students to allow fee assignment
  const { data: students } = await supabase
    .from('students')
    .select('id, name, register_number')
    .order('name');

  // Fetch all existing structures
  const { data: structures } = await supabase
    .from('fee_structures')
    .select('*')
    .order('academic_year', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d]">Fee Structure Management</h1>
          <p className="text-gray-600">Assign and update official fees per student per academic year.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Setup Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit sticky top-8">
          <h3 className="font-bold text-[#1a365d] mb-6">Assign Official Fees</h3>
          <form action={updateFeeStructure} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select Student *</label>
              <select name="studentId" required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Student</option>
                {students?.map(s => (
                  <option key={s.id} value={s.id}>{s.register_number} - {s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Academic Year *</label>
              <select name="academicYear" required className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value="2023-2024">2023-2024</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tuition Fee (₹)</label>
              <input type="number" name="tuitionFee" step="0.01" defaultValue="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Transport Fee (₹)</label>
              <input type="number" name="transportFee" step="0.01" defaultValue="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Hostel Fee (₹)</label>
              <input type="number" name="hostelFee" step="0.01" defaultValue="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <button type="submit" className="w-full py-3 bg-[#1a365d] text-white rounded-lg font-bold hover:bg-blue-800 transition-colors shadow-sm mt-4">
              Set Fee Structure
            </button>
          </form>
        </div>

        {/* Current Structures List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-bold text-[#1a365d]">Existing Fee Assignments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold">Year</th>
                  <th className="px-6 py-4 font-semibold">Tuition</th>
                  <th className="px-6 py-4 font-semibold">Transport</th>
                  <th className="px-6 py-4 font-semibold">Hostel</th>
                  <th className="px-6 py-4 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {structures && structures.length > 0 ? (
                  structures.map((s) => {
                    // We need student name for the table, but structure only has student_id.
                    // In a real app, we'd join the tables.
                    const total = (s.tuition_fee || 0) + (s.transport_fee || 0) + (s.hostel_fee || 0);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{s.student_id.slice(0,8)}...</td>
                        <td className="px-6 py-4 text-gray-600">{s.academic_year}</td>
                        <td className="px-6 py-4">₹{s.tuition_fee}</td>
                        <td className="px-6 py-4">₹{s.transport_fee}</td>
                        <td className="px-6 py-4">₹{s.hostel_fee}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">₹{total}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No fee structures assigned yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
