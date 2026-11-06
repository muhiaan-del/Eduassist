import { NextResponse } from 'next/server'
import { extractTextFromImage } from '@/lib/ocr'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await extractTextFromImage(buffer)
    return NextResponse.json({ text })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}