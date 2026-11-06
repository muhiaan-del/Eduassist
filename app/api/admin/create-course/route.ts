import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const { title, institutionId, adminId, joinCode } = await req.json()

    if (!joinCode || joinCode.trim().length < 2) {
      return NextResponse.json({ error: 'Course code required (min 2 characters)' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('courses')
      .insert({
        title,
        join_code: joinCode.trim().toUpperCase(),
        institution_id: institutionId,
        owner_id: adminId
      })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}