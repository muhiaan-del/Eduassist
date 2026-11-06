import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    // We now receive 'username' instead of 'email'
    const { username, fullName, classId, courseId } = await req.json()

    // 1. Find the course and its institution domain
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('institution_id, institutions(domain)')
      .eq('id', courseId)
      .single()

    if (courseError || !course) throw new Error('Course not found')
    
    const domain = (course.institutions as any)?.domain
    if (!domain) throw new Error('Institution domain not found')

    // 2. Construct the full email
    const email = `${username}@${domain}`
    const tempPassword = 'Std' + Math.random().toString(36).slice(-6) + '!'

    // 3. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true
    })

    if (authError) throw new Error(`Auth Error: ${authError.message}`)
    if (!authData.user) throw new Error('No user returned from Auth')

    // 4. Create Profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        role: 'student',
        email: email,
        full_name: fullName,
        institution_id: course.institution_id,
        requires_password_change: true
      })

    if (profileError) throw new Error(`Profile Error: ${profileError.message}`)

    // 5. Enroll Student
    const { error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .insert({
        student_id: authData.user.id,
        course_id: courseId,
        class_id: classId
      })

    if (enrollError) throw new Error(`Enrollment Error: ${enrollError.message}`)

    return NextResponse.json({ success: true, password: tempPassword, fullEmail: email })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}