import { AccessToken } from 'livekit-server-sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { roomName, role } = await req.json()
    if (!roomName) return NextResponse.json({ error: 'Missing roomName' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Look up the session to verify access
    const { data: session } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('room_name', roomName)
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    // Build the token
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: user.id,
        name: user.email || 'User',
        ttl: '2h'
      }
    )

    // Room permissions
    if (role === 'host') {
      at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true })
    } else {
      // Students can listen but not publish
      at.addGrant({ roomJoin: true, room: roomName, canPublish: false, canSubscribe: true })
    }

    const jwt = await at.toJwt()
    return NextResponse.json({ token: jwt, url: process.env.NEXT_PUBLIC_LIVEKIT_URL })
  } catch (error: any) {
    console.error('[livekit/token] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}