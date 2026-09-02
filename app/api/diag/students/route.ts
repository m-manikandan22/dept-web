import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const adminSupabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const regNo = searchParams.get('regNo');

  try {
    // 1. Check total count
    const { count: totalCount, error: countError } = await adminSupabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // 2. Check for specific register number
    let studentData = null;
    if (regNo) {
      const { data: student, error: studentError } = await adminSupabase
        .from('students')
        .select('id, register_number, name, email, status')
        .eq('register_number', regNo)
        .single();

      if (!studentError) {
        studentData = student;
      }
    }

    // 3. Fuzzy search for similar register numbers
    let fuzzyResults = [];
    if (regNo) {
      const { data: matches, error: fuzzyError } = await adminSupabase
        .from('students')
        .select('register_number, name, email, status')
        .ilike('register_number', `%${regNo.slice(-6)}%`);

      if (!fuzzyError) {
        fuzzyResults = matches;
      }
    }

    return NextResponse.json({
      totalCount,
      studentData,
      fuzzyResults,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
