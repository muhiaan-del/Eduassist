import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { generateEmbedding } from '@/lib/embeddings'
import { extractTextFromImage } from '@/lib/ocr'
import { NextResponse } from 'next/server'

export const maxDuration = 60 // Allow up to 60 seconds on Vercel

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File is too large. Maximum upload size on Vercel is 4MB.' },
        { status: 413 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File
    const courseId = formData.get('courseId') as string
    const unitId = formData.get('unitId') as string

    if (!file || !courseId || !unitId) {
      return NextResponse.json({ error: 'Missing file, courseId, or unitId' }, { status: 400 })
    }

    let extractedText = ''

    // ================================
    // 1. EXTRACT TEXT
    // ================================
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer()
      const uint8 = new Uint8Array(arrayBuffer)
      const safeCopy = uint8.slice()

      const { extractText } = await import('unpdf')
      const { text } = await extractText(uint8, { mergePages: true })

      if (text && text.trim().length > 50) {
        extractedText = text
      } else {
        console.log('Scanned PDF detected. Converting first page to image...')
        const { pdf } = await import('pdf-to-img')

        try {
          const document = await pdf(Buffer.from(safeCopy), { scale: 2 })
          let firstPageImageBuffer: Buffer | null = null
          for await (const image of document) {
            firstPageImageBuffer = image
            break
          }
          if (!firstPageImageBuffer) throw new Error('Failed to convert PDF to image.')

          console.log('Running OCR...')
          extractedText = await extractTextFromImage(firstPageImageBuffer)
          console.log('OCR succeeded.')
        } catch (innerError: any) {
          console.error('Error during PDF OCR:', innerError)
          throw innerError
        }
      }
    } else if (file.type.startsWith('image/')) {
      const arrayBuffer = await file.arrayBuffer()
      const imageBuffer = Buffer.from(arrayBuffer)
      console.log('Running OCR on image...')
      extractedText = await extractTextFromImage(imageBuffer)
      console.log('OCR succeeded.')
    } else {
      extractedText = await file.text()
    }

    if (!extractedText || extractedText.trim() === '') {
      return NextResponse.json({ error: 'Could not extract text from file.' }, { status: 400 })
    }

    // ================================
    // 2. SAVE MATERIAL
    // ================================
    console.log('[upload] Inserting material metadata...')
    let materialId: string

    {
      const { data: material, error: dbError } = await supabaseAdmin
        .from('materials')
        .insert({
          course_id: courseId,
          unit_id: unitId,
          title: file.name,
          content: '',
          owner_id: user.id
        })
        .select()
        .single()

      if (dbError) {
        console.error('[upload] INSERT FAILED:', dbError.code, dbError.message)
        throw new Error(`Insert failed: ${dbError.message}`)
      }
      materialId = material.id
      console.log('[upload] Material inserted:', materialId)
    }

    const truncated = extractedText.substring(0, 50000)
    console.log(`[upload] Updating content (${truncated.length} chars)...`)
    {
      const { error: updateError } = await supabaseAdmin
        .from('materials')
        .update({ content: truncated })
        .eq('id', materialId)

      if (updateError) {
        console.error('[upload] UPDATE FAILED:', updateError.code, updateError.message)
        throw updateError
      }
      console.log('[upload] Content updated.')
    }

    // ================================
    // 3. FIRE & FORGET BACKGROUND EMBEDDINGS
    // ================================
    processBackgroundEmbeddings(extractedText, materialId, courseId)

    return NextResponse.json({
      success: true,
      message: 'File saved! AI is reading it in the background. Refresh in 10 seconds.'
    })

  } catch (error: any) {
    console.error('[upload] FINAL ERROR:', {
      name: error.name,
      message: error.message,
      code: error.code,
      details: error.details,
      cause: error.cause?.message
    })
    return NextResponse.json({ 
      error: error.message, 
      details: error.cause?.message || 'Check Vercel logs for the exact cause.' 
    }, { status: 500 })
  }
}

// ================================
// BACKGROUND TASK FUNCTION
// ================================
async function processBackgroundEmbeddings(extractedText: string, materialId: string, courseId: string) {
  try {
    console.log('[background] Chunking...')
    const sentences = extractedText.match(/[^.!?]+[.!?]+/g) || [extractedText]
    const chunks: string[] = []
    let currentChunk = ''

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > 500) {
        if (currentChunk) chunks.push(currentChunk.trim())
        currentChunk = sentence
      } else {
        currentChunk += ' ' + sentence
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim())

    const validChunks = chunks.filter(c => c.length >= 20)
    console.log(`[background] ${validChunks.length} valid chunks.`)

    const embeddings: { content: string; embedding: number[] }[] = []
    console.log('[background] Generating embeddings...')

    for (let i = 0; i < validChunks.length; i++) {
      try {
        const embedding = await generateEmbedding(validChunks[i])
        embeddings.push({ content: validChunks[i], embedding })
      } catch (embErr: any) {
        console.error(`[background] Embedding failed at ${i}:`, embErr.message)
      }
    }

    console.log(`[background] ${embeddings.length} embeddings generated. Inserting...`)
    const BATCH_SIZE = 20
    let savedChunks = 0

    for (let i = 0; i < embeddings.length; i += BATCH_SIZE) {
      const batch = embeddings.slice(i, i + BATCH_SIZE).map(({ content, embedding }) => ({
        material_id: materialId,
        course_id: courseId,
        content,
        embedding
      }))

      try {
        const { error: batchErr } = await supabaseAdmin
          .from('material_chunks')
          .insert(batch)

        if (!batchErr) savedChunks += batch.length
      } catch (networkErr: any) {
        console.error(`[background] Batch network error:`, networkErr.message)
      }
      await new Promise(r => setTimeout(r, 500))
    }

    console.log(`[background] ✅ ${savedChunks}/${embeddings.length} chunks saved.`)
  } catch (err: any) {
    console.error('[background] FATAL ERROR:', err)
  }
}