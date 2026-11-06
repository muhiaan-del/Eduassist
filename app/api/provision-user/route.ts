import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const { username, fullName, role, institutionId } = await req.json()

    // Get institution domain
    const { data: inst, error: instError } = await supabaseAdmin
      .from('institutions').select('domain').eq('id', institutionId).single()
    if (instError || !inst) throw new Error('Institution not found')

    const email = `${username}@${inst.domain}`
    const tempPassword = 'Edu' + Math.random().toString(36).slice(-6) + '!'

    // Create user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true
    })

    if (authError) throw new Error(`Auth Error: ${authError.message}`)
    if (!authData.user) throw new Error('No user returned')

    // Create profile with requires_password_change = TRUE
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        role: role,
        email: email,
        full_name: fullName,
        institution_id: institutionId,
        requires_password_change: true   // <--- CRITICAL FIX
      })

    if (profileError) throw new Error(`Profile Error: ${profileError.message}`)

    return NextResponse.json({ success: true, password: tempPassword, fullEmail: email })
  } catch (error: any) {
    console.error('provision-user error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}