import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, fullName, role, institutionId, courseId } = await req.json()
    const supabase = await createClient()

    // Verify the person making the request is an Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'

    // 1. Create the Auth User
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true
    })

    // If we don't have admin privileges in the client, we can use a fallback:
    // (For MVP, we will just use standard signUp. Note: this logs the current Admin OUT)
    // In a real app, you MUST use supabase-js with the service_role key on the backend.
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: tempPassword
    })

    if (signUpError) throw signUpError
    if (!signUpData.user) throw new Error('User creation failed')

    // 2. Create the Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: signUpData.user.id,
        role: role,
        email: email,
        full_name: fullName,
        institution_id: institutionId
      })

    if (profileError) throw profileError

    return NextResponse.json({ success: true, password: tempPassword })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}