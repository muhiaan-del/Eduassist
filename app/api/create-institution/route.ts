import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const { 
      institutionName, 
      domain, 
      address, 
      contactEmail, 
      contactPhone,
      adminName,
      adminEmail, 
      adminPassword 
    } = await req.json()

    // 1. Create the Admin Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    })

    if (authError) throw new Error(`Auth Error: ${authError.message}`)
    if (!authData.user) throw new Error('No user returned from Auth')

    // 2. Create the Institution
    const { data: inst, error: instError } = await supabaseAdmin
      .from('institutions')
      .insert({ 
        name: institutionName, 
        domain: domain, 
        address: address,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        admin_id: authData.user.id 
      })
      .select()
      .single()

    if (instError) throw new Error(`Institution DB Error: ${instError.message}`)

    // 3. Create the Admin Profile
    const { error: profError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        role: 'admin',
        email: adminEmail,
        full_name: adminName,
        institution_id: inst.id
      })

    if (profError) throw new Error(`Profile DB Error: ${profError.message}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Setup Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}