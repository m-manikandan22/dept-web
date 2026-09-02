'use client'

import { deleteStudent } from '@/app/staff/actions';

export default function DeleteStudentButton({ studentId }: { studentId: string }) {
  async function handleDelete(formData: FormData) {
    if (confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      await deleteStudent(formData);
    }
  }

  return (
    <form action={handleDelete}>
      <input type="hidden" name="studentId" value={studentId} />
      <button type="submit" className="text-red-600 hover:underline text-sm">
        Delete
      </button>
    </form>
  );
}
