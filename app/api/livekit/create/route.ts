import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const { classId, title } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const roomName = `live-${randomUUID()}`

    const { data, error } = await admin
      .from('live_sessions')
      .insert({
        class_id: classId,
        lecturer_id: user.id,
        room_name: roomName,
        title,
        status: 'live',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ session: data })
  } catch (error: any) {
    console.error('[livekit/create] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}