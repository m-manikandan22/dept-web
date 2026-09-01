import './globals.css';
import { getUserRole } from '@/lib/auth';
import Link from 'next/link';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex min-h-screen">
          {role && (
            <aside className="w-64 bg-[#1a365d] text-white p-8 flex flex-col">
              <div className="text-xl font-bold mb-8 uppercase tracking-wider">IIDS Portal</div>
              <nav className="flex-grow">
                <ul className="space-y-2">
                  {role === 'STUDENT' && (
                    <>
                      <li><Link href="/dashboard" className="block p-2 rounded hover:bg-white/10">Dashboard</Link></li>
                      <li><Link href="/student/profile" className="block p-2 rounded hover:bg-white/10">My Profile</Link></li>
                      <li><Link href="/student/academics" className="block p-2 rounded hover:bg-white/10">Academics</Link></li>
                      <li><Link href="/student/fees" className="block p-2 rounded hover:bg-white/10">Fees & Payments</Link></li>
                      <li><Link href="/student/achievements" className="block p-2 rounded hover:bg-white/10">Achievements</Link></li>
                      <li><Link href="/student/certifications" className="block p-2 rounded hover:bg-white/10">Certifications</Link></li>
                      <li><Link href="/student/hostel" className="block p-2 rounded hover:bg-white/10">Hostel</Link></li>
                      <li><Link href="/student/transport" className="block p-2 rounded hover:bg-white/10">Transport</Link></li>
                    </>
                  )}
                  {(role === 'STAFF' || role === 'ADMIN') && (
                    <>
                      <li><Link href="/dashboard" className="block p-2 rounded hover:bg-white/10">Dashboard</Link></li>
                      <li><Link href="/staff/students" className="block p-2 rounded hover:bg-white/10">Manage Students</Link></li>
                      <li><Link href="/staff/verify" className="block p-2 rounded hover:bg-white/10">Verification Queue</Link></li>
                      {role === 'ADMIN' && (
                        <li><Link href="/admin/logs" className="block p-2 rounded hover:bg-white/10">Audit Logs</Link></li>
                      )}
                    </>
                  )}
                </ul>
              </nav>
              <div className="mt-auto">
                <form action="/api/auth/logout" method="POST">
                  <button className="w-full text-left p-2 rounded hover:bg-white/10">Logout</button>
                </form>
              </div>
            </aside>
          )}
          <main className="flex-1 bg-[#f7fafc] p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
