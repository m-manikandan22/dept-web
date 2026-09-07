import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') || '/dashboard';

  if (!token_hash) {
    return NextResponse.redirect(new URL('/login?message=Invalid verification link', request.url));
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as any,
  });

  if (error) {
    console.error('[AUTH][CONFIRM] Verification failed:', error.message);
    return NextResponse.redirect(new URL('/login?message=Verification failed. Please try again.', request.url));
  }

  console.log('[AUTH][CONFIRM] Email verified successfully');
  return NextResponse.redirect(new URL(next, request.url));
}
