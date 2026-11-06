import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import axios from 'axios'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const { courseId, topic } = await req.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: materials } = await supabase
      .from('materials').select('content').eq('course_id', courseId)

    if (!materials || materials.length === 0) {
      return NextResponse.json({ error: 'No materials found' }, { status: 400 })
    }

    // PII Redaction — prevents model safety refusals
    const rawContext = materials.map(m => m.content).join('\n\n').substring(0, 3000)
    const contextText = rawContext
      .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]')
      .replace(/\b\d{6,}\b/g, '[number]')
      .replace(/[A-Z]{1,3}\d{6,}[A-Z]?/g, '[id]')
      .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[phone]')
      .replace(/\bP\.?\s?O\.?\s?Box\s*\d+/gi, '[address]')

    const systemPrompt = `You are helping a university lecturer create revision material for their own course.

Task: Create 5 multiple-choice revision questions about "${topic}" using the course notes below. This is for student self-study before exams.

Output format: a JSON array of 5 objects. Each object must have:
- "question": the question text (string)
- "options": exactly 4 answer choices (strings)
- "correct_index": integer from 0-3 pointing to the correct option

Return ONLY the JSON array. No explanation, no markdown, no other text.

--- COURSE NOTES START ---
${contextText}
--- COURSE NOTES END ---

Generate the JSON array of 5 revision questions now.`

    console.log('[generate-quiz] Context length:', contextText.length)

    // Updated fallback list: gpt-oss-120b replaces retired llama-3.3-70b-versatile
    const models = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b']
    let questions: any[] = []
    let lastRefusal = ''

    for (const model of models) {
      console.log(`[generate-quiz] Trying model: ${model}`)

      let aiData: any
      try {
        const axiosRes = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model,
            messages: [{ role: 'user', content: systemPrompt }],
            temperature: 0.3,
            max_tokens: 1000
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          }
        )
        aiData = axiosRes.data
      } catch (axiosErr: any) {
        const detail = axiosErr.response?.data?.error?.message || axiosErr.message
        console.error(`[generate-quiz] ${model} network error:`, detail)
        lastRefusal = `Network: ${detail}`
        continue
      }

      let rawJson = (aiData.choices?.[0]?.message?.content || '')
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()

      console.log(`[generate-quiz] ${model} raw output (first 200):`, rawJson.substring(0, 200))

      // Detect refusal
      if (
        rawJson.toLowerCase().includes("can't comply") ||
        rawJson.toLowerCase().includes("cannot comply") ||
        rawJson.toLowerCase().includes("i'm sorry") ||
        rawJson.toLowerCase().includes("i apologize")
      ) {
        console.log(`[generate-quiz] ${model} refused. Trying next model...`)
        lastRefusal = 'Model refused'
        continue
      }

      // Parse
      try {
        const parsed = JSON.parse(rawJson)
        if (Array.isArray(parsed)) {
          questions = parsed
        } else if (parsed && typeof parsed === 'object') {
          const arrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]))
          if (arrayKey) questions = parsed[arrayKey]
        }
      } catch {
        const match = rawJson.match(/\[[\s\S]*\]/)
        if (match) {
          try { questions = JSON.parse(match[0]) } catch { /* ignore */ }
        }
      }

      if (Array.isArray(questions) && questions.length > 0) {
        console.log(`[generate-quiz] ${model} succeeded with ${questions.length} questions.`)
        break
      }
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('[generate-quiz] All models failed or refused. Last reason:', lastRefusal)
      throw new Error(
        'AI could not generate questions. Last error: ' + lastRefusal
      )
    }

    // Filter malformed
    questions = questions.filter((q: any) =>
      q &&
      typeof q.question === 'string' &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correct_index === 'number' &&
      q.correct_index >= 0 &&
      q.correct_index < 4
    )

    if (questions.length === 0) {
      throw new Error('No valid questions could be parsed from AI response')
    }

    const toInsert = questions.map((q: any) => ({
      course_id: courseId,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      published: false,
      owner_id: user.id
    }))

    const { error: dbError } = await supabaseAdmin.from('questions').insert(toInsert)
    if (dbError) throw dbError

    console.log(`[generate-quiz] ✅ Saved ${questions.length} draft questions.`)
    return NextResponse.json({ success: true, count: questions.length })

  } catch (error: any) {
    console.error('[generate-quiz] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}