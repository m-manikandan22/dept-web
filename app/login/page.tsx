import { createClient, getUserRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function LoginPage(props: {
  searchParams: Promise<{ message?: string }>;
}) {
  const searchParams = await props.searchParams;
  const role = await getUserRole();
  if (role) redirect('/dashboard');

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f7fafc]">
      <div className="login-card text-center">
        <div className="login-header mb-8">
          <h1 className="text-2xl font-bold text-[#1a365d] mb-2">IIDS Student Portal</h1>
          <p className="text-gray-500 text-sm">Please enter your credentials to continue</p>
        </div>

        {searchParams.message && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded text-sm">
            {searchParams.message}
          </div>
        )}

        <form action="/api/auth/login" method="POST" className="text-left">
          <div className="form-group mb-4">
            <label className="form-label">Register Number</label>
            <input
              name="email"
              type="text"
              className="form-input"
              placeholder="Enter your register number"
              required
            />
          </div>
          <div className="form-group mb-6">
            <label className="form-label">Secret Key / Password</label>
            <input
              name="password"
              type="password"
              className="form-input"
              placeholder="Enter your secret key"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full justify-center">
            Login to Portal
          </button>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account? <Link href="/register" className="text-blue-600 hover:underline">Register here</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
