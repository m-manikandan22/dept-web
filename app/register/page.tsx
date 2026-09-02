import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/auth';

export default async function RegisterPage(props: {
  searchParams: Promise<{ message?: string }>;
}) {
  const searchParams = await props.searchParams;
  const role = await getUserRole();
  if (role) redirect('/dashboard');

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f7fafc]">
      <div className="login-card text-center">
        <div className="login-header mb-8">
          <h1 className="text-2xl font-bold text-[#1a365d] mb-2">Student Registration</h1>
          <p className="text-gray-500 text-sm">Create your account to access the portal</p>
        </div>

        {searchParams.message && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded text-sm text-left">
            {searchParams.message}
          </div>
        )}

        <form action="/api/auth/register" method="POST" className="text-left">
          <div className="form-group mb-4">
            <label className="form-label">Register Number</label>
            <input
              name="registerNumber"
              type="text"
              className="form-input"
              placeholder="Enter your register number"
              required
              autoComplete="off"
            />
          </div>
          <div className="form-group mb-4">
            <label className="form-label">Email Address</label>
            <input
              name="email"
              type="email"
              className="form-input"
              placeholder="Enter your college email"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group mb-6">
            <label className="form-label">Create Password</label>
            <input
              name="password"
              type="password"
              className="form-input"
              placeholder="Enter a strong password"
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full justify-center">
            Register Account
          </button>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Login here</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
