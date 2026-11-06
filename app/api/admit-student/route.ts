import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    // 1. We now receive 'classIds' as an array
    const { username, fullName, classIds, institutionId } = await req.json()

    if (!classIds || classIds.length === 0) {
      throw new Error('At least one class must be selected')
    }

    // 2. Get institution domain
    const { data: inst } = await supabaseAdmin
      .from('institutions')
      .select('domain')
      .eq('id', institutionId)
      .single()
      
    if (!inst) throw new Error('Institution not found')

    // 3. Construct Email & Password
    const email = `${username}@${inst.domain}`
    const tempPassword = 'Std' + Math.random().toString(36).slice(-6) + '!'

    // 4. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true
    })

    if (authError) throw new Error(`Auth Error: ${authError.message}`)
    if (!authData.user) throw new Error('No user returned from Auth')

    // 5. Create Profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        role: 'student',
        email: email,
        full_name: fullName,
        institution_id: institutionId,
        requires_password_change: true
      })

    if (profileError) throw new Error(`Profile Error: ${profileError.message}`)

    // 6. Fetch the course_id for each selected class
    const { data: classesData, error: classError } = await supabaseAdmin
      .from('classes')
      .select('id, unit_id, units(course_id)')
      .in('id', classIds)

    if (classError || !classesData) throw new Error('Failed to fetch class details')

    // 7. Prepare enrollments (One for each class)
    const enrollments = classesData.map((cls: any) => ({
      student_id: authData.user!.id,
      course_id: cls.units.course_id,
      class_id: cls.id
    }))

    // 8. Bulk insert enrollments
    const { error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .insert(enrollments)

    if (enrollError) throw new Error(`Enrollment Error: ${enrollError.message}`)

    return NextResponse.json({ success: true, password: tempPassword, fullEmail: email })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}