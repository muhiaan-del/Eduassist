import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { generateEmbedding } from '@/lib/embeddings'
import { extractTextFromImage } from '@/lib/ocr'
import { NextResponse } from 'next/server'

export const maxDuration = 60

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    console.log('[upload] --- 1. Request Started ---');
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('[upload] Error: Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('[upload] --- 2. User Authenticated:', user.id, '---');

    const formData = await req.formData()
    const file = formData.get('file') as File
    const courseId = formData.get('courseId') as string
    const unitId = formData.get('unitId') as string

    if (!file || !courseId || !unitId) {
      console.log('[upload] Error: Missing fields', { file: !!file, courseId, unitId });
      return NextResponse.json({ error: 'Missing file, courseId, or unitId' }, { status: 400 })
    }
    console.log('[upload] --- 3. Form Data Parsed. File:', file.name, file.type, file.size, '---');

    let extractedText = ''

    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer()
      const pdfBuffer = Buffer.from(arrayBuffer)
      
      const { extractText, renderPageAsImage } = await import('unpdf')
      
      // 1. Try to extract text first
      const { text } = await extractText(new Uint8Array(pdfBuffer), { mergePages: true })
      
      if (text && text.trim().length > 50) {
        extractedText = text
      } else {
        console.log('[upload] Scanned PDF detected. Rendering page to image...')
        
        // 2. Render page 1 to a PNG Uint8Array using unpdf's built-in renderer
        const imageUint8 = await renderPageAsImage(pdfBuffer, 1, {
          scale: 2.0,
          toDataURL: false,
        })

        if (!imageUint8) {
          throw new Error('Failed to render PDF page to image.')
        }

        // 3. Convert to Buffer for Tesseract
        const firstPageImageBuffer = Buffer.from(imageUint8)

        console.log('[upload] Running Tesseract OCR on rendered PDF page...')
        extractedText = await extractTextFromImage(firstPageImageBuffer)
      }
    } else if (file.type.startsWith('image/')) {
      const arrayBuffer = await file.arrayBuffer()
      const imageBuffer = Buffer.from(arrayBuffer)
      console.log('[upload] Running Tesseract OCR on image...')
      extractedText = await extractTextFromImage(imageBuffer)
    } else {
      console.log('[upload] --- 4. Parsing as plain text ---');
      extractedText = await file.text()
    }

    console.log('[upload] --- 5. Text Extraction Done. Length:', extractedText.length, '---');

    if (!extractedText || extractedText.trim() === '') {
      console.log('[upload] Error: Extracted text is empty');
      return NextResponse.json({ error: 'Could not extract text from file.' }, { status: 400 })
    }

    console.log('[upload] --- 6. Inserting into Supabase ---');
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
      console.error('[upload] DB Insert Error:', dbError);
      throw new Error(`Insert failed: ${dbError.message}`)
    }
    
    const materialId = material.id
    console.log('[upload] --- 7. Material Inserted:', materialId, '---');

    const truncated = extractedText.substring(0, 50000)
    const { error: updateError } = await supabaseAdmin
      .from('materials')
      .update({ content: truncated })
      .eq('id', materialId)

    if (updateError) throw updateError
    console.log('[upload] --- 8. Content Updated. Starting Background Task ---');

    processBackgroundEmbeddings(extractedText, materialId, courseId)

    return NextResponse.json({
      success: true,
      message: 'File saved! AI is reading it in the background. Refresh in 10 seconds.'
    })

  } catch (error: any) {
    console.error('[upload] FATAL ERROR:', error)
    return NextResponse.json({ 
      error: error.message, 
      details: error.cause?.message || 'Check Vercel logs for the exact cause.' 
    }, { status: 500 })
  }
}

async function processBackgroundEmbeddings(extractedText: string, materialId: string, courseId: string) {
  try {
    console.log('[background] Starting embeddings...');
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

    for (let i = 0; i < validChunks.length; i++) {
      try {
        const embedding = await generateEmbedding(validChunks[i])
        embeddings.push({ content: validChunks[i], embedding })
      } catch (embErr: any) {
        console.error(`[background] Embedding failed at ${i}:`, embErr.message)
      }
    }

    const BATCH_SIZE = 20
    let savedChunks = 0

    for (let i = 0; i < embeddings.length; i += BATCH_SIZE) {
      const batch = embeddings.slice(i, i + BATCH_SIZE).map(({ content, embedding }) => ({
        material_id: materialId,
        course_id: courseId,
        content,
        embedding
      }))

      const { error: batchErr } = await supabaseAdmin.from('material_chunks').insert(batch)
      if (!batchErr) savedChunks += batch.length
      await new Promise(r => setTimeout(r, 500))
    }

    console.log(`[background] ✅ ${savedChunks}/${embeddings.length} chunks saved.`)
  } catch (err: any) {
    console.error('[background] FATAL ERROR:', err)
  }
}