import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  // 1. CSRF State Validation
  const cookieStore = await cookies();
  const storedState = cookieStore.get('oauth_state')?.value;

  // Clear state cookie immediately to prevent replay attacks
  cookieStore.delete('oauth_state');

  if (!state || !storedState || state !== storedState) {
    return NextResponse.json({ error: 'Invalid or missing state parameter. Potential CSRF detected.' }, { status: 403 });
  }

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  try {
    // 2. Exchange authorization code for tokens
    const { tokens } = await oAuth2Client.getToken(code);

    // 3. Securely handle the refresh token
    // Only print the refresh token to the server terminal in development mode.
    if (process.env.NODE_ENV === 'development') {
      if (tokens.refresh_token) {
        console.log('\n' + '='.repeat(50));
        console.log('GMAIL OAUTH AUTHORIZATION SUCCESSFUL (DEV MODE)');
        console.log('Copy the following Refresh Token into your .env.local:');
        console.log('\nGMAIL_REFRESH_TOKEN=' + tokens.refresh_token);
        console.log('='.repeat(50) + '\n');
      } else {
        console.warn('[AUTH][GMAIL] Authorization successful, but no refresh token was returned. Ensure you used prompt=consent.');
      }
    }

    // 4. Return a safe success response to the browser
    // This response contains NO tokens and NO sensitive data.
    return NextResponse.json({
      message: 'Gmail authorization successful. Check the development server terminal for the refresh token.',
    });
  } catch (error: any) {
    console.error('[AUTH][GMAIL] OAuth Token Exchange Error:', error.message);
    return NextResponse.json({ error: 'Failed to exchange code for tokens' }, { status: 500 });
  }
}
