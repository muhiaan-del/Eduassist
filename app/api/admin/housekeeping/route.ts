import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, id, data } = body

    if (!action || !id) {
      return NextResponse.json({ error: 'Missing action or id' }, { status: 400 })
    }

    // --- DELETE ACTIONS ---
    if (action === 'delete-user') {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
      if (error) throw error
    } 
    else if (action === 'delete-course') {
      // Cascade: Delete materials, units, and classes first
      const { data: units } = await supabaseAdmin.from('units').select('id').eq('course_id', id)
      if (units && units.length > 0) {
        const unitIds = units.map(u => u.id)
        await supabaseAdmin.from('classes').delete().in('unit_id', unitIds)
        await supabaseAdmin.from('units').delete().eq('course_id', id)
      }
      await supabaseAdmin.from('materials').delete().eq('course_id', id)
      const { error } = await supabaseAdmin.from('courses').delete().eq('id', id)
      if (error) throw error
    }
    else if (action === 'delete-unit') {
      // Cascade: Delete classes first
      await supabaseAdmin.from('classes').delete().eq('unit_id', id)
      const { error } = await supabaseAdmin.from('units').delete().eq('id', id)
      if (error) throw error
    }
    else if (action === 'delete-class') {
      const { error } = await supabaseAdmin.from('classes').delete().eq('id', id)
      if (error) throw error
    }

    // --- EDIT/UPDATE ACTIONS ---
    else if (action === 'edit-faculty' || action === 'edit-student') {
      if (!data || !data.full_name) throw new Error('Missing full_name')
      const { error } = await supabaseAdmin.from('profiles').update({ full_name: data.full_name }).eq('id', id)
      if (error) throw error
    }
    else if (action === 'edit-course') {
      if (!data || !data.title) throw new Error('Missing title')
      const { error } = await supabaseAdmin.from('courses').update({ title: data.title }).eq('id', id)
      if (error) throw error
    }
    else if (action === 'edit-unit') {
      if (!data || !data.name || !data.unit_code) throw new Error('Missing name or unit_code')
      const { error } = await supabaseAdmin.from('units').update({ name: data.name, unit_code: data.unit_code }).eq('id', id)
      if (error) throw error
    }
    else if (action === 'edit-class') {
      const updateData: any = {}
      if (data.name) updateData.name = data.name
      if (data.lecturer_id) updateData.lecturer_id = data.lecturer_id
      
      const { error } = await supabaseAdmin.from('classes').update(updateData).eq('id', id)
      if (error) throw error
    }
    else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Housekeeping API Error]', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}