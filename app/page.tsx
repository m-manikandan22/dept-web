import { redirect } from 'next/navigation';

export default function RootPage() {
  // Root page simply redirects to login.
  // No auth or profile checks are performed here.
  redirect('/login');
}
