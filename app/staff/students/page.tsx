import { getUserRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { studentRepository } from '@/lib/repositories/studentRepository';
import DeleteStudentButton from '@/app/staff/components/DeleteStudentButton';

export default async function StaffStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; section?: string; search?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const role = await getUserRole();
  if (!role || role === 'STUDENT') redirect('/login');

  const students = await studentRepository.getAll(resolvedSearchParams);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#1a365d]">Student Directory</h1>
        <Link href="/staff/create-student" className="btn btn-primary">
          + Add New Student
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4" method="GET">
          <div className="form-group mb-0">
            <label className="form-label">Search</label>
            <input
              name="search"
              defaultValue={resolvedSearchParams.search}
              className="form-input"
              placeholder="Name or Reg No..."
            />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Batch</label>
            <input
              name="batch"
              defaultValue={resolvedSearchParams.batch}
              className="form-input"
              placeholder="e.g. 2021-25"
            />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Section</label>
            <input
              name="section"
              defaultValue={resolvedSearchParams.section}
              className="form-input"
              placeholder="e.g. A"
            />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn btn-primary flex-1">Filter</button>
            <a href="/staff/students" className="btn btn-ghost">Reset</a>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Register No</th>
              <th className="p-4 font-semibold text-gray-600">Name</th>
              <th className="p-4 font-semibold text-gray-600">Batch</th>
              <th className="p-4 font-semibold text-gray-600">Section</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
              <th className="p-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No students found matching the criteria.</td>
              </tr>
            ) : (
              students.map((student: any) => (
                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">{student.register_number}</td>
                  <td className="p-4">{student.name}</td>
                  <td className="p-4">{student.batch?.name || 'N/A'}</td>
                  <td className="p-4">{student.section}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      student.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <Link href={`/staff/students/${student.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                    <DeleteStudentButton studentId={student.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
