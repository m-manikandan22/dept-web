import { getUserRole } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AuditLogsPage() {
  const role = await getUserRole();
  if (role !== 'ADMIN') redirect('/login');

  // Fetch logs from supabase (skipping repo for brevity here, would typically use an auditRepository)
  // For now, we'll implement a simple client call
  const { data: logs } = await createClient().from('audit_logs').select('*').order('timestamp', { ascending: false });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-[#1a365d]">System Audit Logs</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-sm font-semibold text-gray-600">
              <th className="p-4">Timestamp</th>
              <th className="p-4">User</th>
              <th className="p-4">Action</th>
              <th className="p-4">Module</th>
              <th className="p-4">Register No</th>
              <th className="p-4">Result</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {logs?.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">No logs found.</td></tr>
            ) : (
              logs?.map((log: any) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-4 font-medium">{log.role}</td>
                  <td className="p-4">{log.action}</td>
                  <td className="p-4">{log.module}</td>
                  <td className="p-4">{log.register_number || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      log.result === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {log.result}
                    </span>
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
