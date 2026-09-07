import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { sendVerificationEmail } from '@/lib/email/gmail';

const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN?.trim().toLowerCase() || '';
const REGISTER_NUMBER_PATTERN = /^[A-Z0-9]{6,20}$/;
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export async function POST(request: Request) {
  const formData = await request.formData();

  const registerNumber = (formData.get('registerNumber') as string || '').trim().toUpperCase();
  const name = (formData.get('name') as string || '').trim();
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // 1. Input Validation
  if (!registerNumber || !name || !email || !password) {
    return redirect('/register?status=error&message=All required fields must be filled in.');
  }

  if (password !== confirmPassword) {
    return redirect('/register?status=error&message=Passwords do not match.');
  }

  if (!PASSWORD_POLICY.test(password)) {
    return redirect('/register?status=error&message=Password must be at least 8 characters and include an uppercase letter, lowercase letter, and number.');
  }

  if (!REGISTER_NUMBER_PATTERN.test(registerNumber)) {
    return redirect('/register?status=error&message=Register number format looks invalid.');
  }

  if (ALLOWED_EMAIL_DOMAIN && !email.endsWith('@' + ALLOWED_EMAIL_DOMAIN)) {
    return redirect(`/register?status=error&message=Please use your college email ending in @${ALLOWED_EMAIL_DOMAIN}.`);
  }

  const adminSupabase = createAdminClient();

  // Track resources created by THIS request for potential rollback
  let authUserCreated = false;
  let studentCreated = false;
  let authUserId: string | null = null;
  let studentId: string | null = null;
  let registrationSuccessful = false;

  try {
    // 2. Auth Account Lookup
    console.log(`[AUTH][REGISTER] Checking for existing Auth account: ${email}`);
    const { data: authList, error: authLookupError } = await adminSupabase.auth.admin.listUsers();

    if (authLookupError) {
      console.error(`[AUTH][REGISTER] Auth lookup error:`, authLookupError);
      throw new Error('Unable to verify account status. Please try again.');
    }

    const existingUser = authList?.users.find(u => u.email === email);

    if (existingUser) {
      const isVerified = !!existingUser.email_confirmed_at;

      if (isVerified) {
        console.warn(`[AUTH][REGISTER] Verified account already exists: ${email}`);
        return redirect('/login?message=An account already exists for this email. Please log in instead.');
      }

      // Case: Unverified existing account - Resend verification link
      console.log(`[AUTH][REGISTER] Resending verification for unverified account: ${email}`);
      const { data: resendData, error: resendError } = await adminSupabase.auth.admin.generateLink({
        type: 'signup',
        email,
        password,
      });

      if (resendError) {
        console.error('[AUTH][REGISTER] resend generateLink failed:', resendError.message);
        throw new Error('Unable to resend verification email. Please try again.');
      }

      try {
        await sendVerificationEmail(email, name, resendData.properties.action_link);
        // Mark as successful for this flow (no resources created, just email sent)
        registrationSuccessful = true;
      } catch (emailError) {
        console.error('[AUTH][REGISTER] Email resend failed:', emailError);
        throw new Error('Unable to send verification email. Please try again.');
      }

      // This flow ends here. We redirect outside the try/catch.
      if (registrationSuccessful) {
        // Redirect will happen at the end of the function
      }
    } else {
      // 3. New Auth Account Creation
      console.log(`[AUTH][REGISTER] Creating new Auth account for: ${email}`);
      const { data: signupData, error: signupError } = await adminSupabase.auth.admin.generateLink({
        type: 'signup',
        email,
        password,
      });

      if (signupError) {
        console.error('[AUTH][REGISTER] generateLink failed:', signupError.message);
        throw new Error('Unable to create your account right now. Please try again.');
      }

      authUserId = signupData.user.id;
      authUserCreated = true;
      const confirmationLink = signupData.properties.action_link;

      // 4. Student Record Lookup/Creation
      console.log(`[AUTH][REGISTER] Checking register number: ${registerNumber}`);
      const { data: existingStudent, error: studentLookupError } = await adminSupabase
        .from('students')
        .select('id')
        .eq('register_number', registerNumber)
        .maybeSingle();

      if (studentLookupError) {
        throw new Error(`Student lookup error: ${studentLookupError.message}`);
      }

      if (existingStudent) {
        console.log(`[AUTH][REGISTER] Using existing student record: ${existingStudent.id}`);
        studentId = existingStudent.id;
      } else {
        console.log(`[AUTH][REGISTER] Creating new student record: ${registerNumber}`);
        const { data: newStudent, error: studentInsertError } = await adminSupabase
          .from('students')
          .insert({
            register_number: registerNumber,
            name,
            email,
            department: 'Artificial Intelligence and Data Science',
            status: 'ACTIVE',
          })
          .select('id')
          .single();

        if (studentInsertError) {
          throw new Error(`Student creation failed: ${studentInsertError.message}`);
        }
        studentId = newStudent.id;
        studentCreated = true;
      }

      if (!studentId) {
        throw new Error('Failed to obtain student ID');
      }

      // 5. Profile Lookup/Creation (Idempotent)
      console.log(`[AUTH][REGISTER] Checking for existing profile for user: ${authUserId}`);
      const { data: existingProfile, error: profileLookupError } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('user_id', authUserId)
        .maybeSingle();

      if (profileLookupError) {
        throw new Error(`Profile lookup error: ${profileLookupError.message}`);
      }

      if (!existingProfile) {
        console.log(`[AUTH][REGISTER] Creating new profile for user: ${authUserId}`);
        const { error: profileInsertError } = await adminSupabase
          .from('profiles')
          .insert({
            user_id: authUserId,
            student_id: studentId,
            role: 'STUDENT',
          });

        if (profileInsertError) {
          throw new Error(`Profile creation failed: ${profileInsertError.message}`);
        }
      } else {
        console.log(`[AUTH][REGISTER] Reusing existing profile: ${existingProfile.id}`);
      }

      // 6. Send Verification Email
      console.log(`[AUTH][REGISTER] Sending verification email to: ${email}`);
      try {
        await sendVerificationEmail(email, name, confirmationLink);
        console.log(`[AUTH][REGISTER] Registration successful for: ${email}`);
        registrationSuccessful = true;
      } catch (emailError) {
        throw new Error(`Email sending failed: ${emailError instanceof Error ? emailError.message : String(emailError)}`);
      }
    }
  } catch (error: any) {
    // Handle Next.js redirects separately
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;

    console.error(`[AUTH][REGISTER] Registration error: ${error.message}`);

    // ROLLBACK: Only delete resources created by THIS specific request
    if (authUserCreated && authUserId) {
      try {
        await adminSupabase.auth.admin.deleteUser(authUserId);
        console.log(`[AUTH][REGISTER] Rolled back Auth user: ${authUserId}`);
      } catch (e: any) {
        console.error(`[AUTH][REGISTER] Rollback Auth failed: ${e.message}`);
      }
    }
    if (studentCreated && studentId) {
      try {
        await adminSupabase.from('students').delete().eq('id', studentId);
        console.log(`[AUTH][REGISTER] Rolled back Student record: ${studentId}`);
      } catch (e: any) {
        console.error(`[AUTH][REGISTER] Rollback Student failed: ${e.message}`);
      }
    }

    return redirect('/register?status=error&message=' + encodeURIComponent(error.message));
  }

  // FINAL SUCCESS REDIRECT
  // This occurs outside the try-catch, so it won't trigger the rollback logic.
  if (registrationSuccessful) {
    return redirect('/register?status=success&message=Account created successfully. Please check your email and click the verification link before logging in.');
  }

  return redirect('/register?status=error&message=An unexpected error occurred during registration.');
}
