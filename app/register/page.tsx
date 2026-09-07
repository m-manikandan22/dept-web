import Link from 'next/link';

export default function RegisterInfoPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f7fafc]">
      <div className="max-w-xl p-8 bg-white rounded-lg shadow-lg border border-gray-200 text-center">
        <h1 className="text-3xl font-bold text-[#1a365d] mb-4">Account Creation Restricted</h1>
        <p className="text-gray-700 mb-6">
          New accounts can only be created by an administrator. If you need an account, please contact the
          portal administrator.
        </p>
        <div className="flex flex-col gap-4 justify-center items-center">
          <Link href="/login" className="text-blue-600 hover:underline">
            Back to Login
          </Link>
          <Link href="/forgot-password" className="text-blue-600 hover:underline">
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
}
