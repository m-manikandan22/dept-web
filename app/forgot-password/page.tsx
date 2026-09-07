import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ForgotPasswordPage(props: {
  searchParams: Promise<{ message?: string; status?: string }>;
}) {
  const searchParams = await props.searchParams;

  const getMessageStyles = (status?: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'info':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'error':
      default:
        return 'bg-red-100 text-red-600 border-red-200';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f7fafc]">
      <div className="login-card text-center">
        <div className="login-header mb-8">
          <h1 className="text-2xl font-bold text-[#1a365d] mb-2">Reset Password</h1>
          <p className="text-gray-500 text-sm">Enter your email to receive a password reset link</p>
        </div>

        {searchParams.message && (
          <div className={`mb-4 p-3 rounded text-sm text-left border ${getMessageStyles(searchParams.status)}`}>
            {searchParams.message}
          </div>
        )}

        <form action="/api/auth/forgot-password" method="POST" className="text-left">
          <div className="form-group mb-6">
            <label className="form-label">Email Address *</label>
            <input
              name="email"
              type="email"
              className="form-input"
              placeholder="Enter your registered college email"
              required
              autoComplete="email"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full justify-center">
            Send Reset Link
          </button>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Remembered your password? <Link href="/login" className="text-blue-600 hover:underline">Login here</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
