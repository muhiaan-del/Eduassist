import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Robust parser for any AI output format
function parseFlashcards(raw: string): any[] {
  // 1. Strip markdown fences
  let cleaned = raw.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  // 2. Try direct parse
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed
    // Some models wrap in { flashcards: [...] } or { cards: [...] }
    if (parsed && typeof parsed === 'object') {
      for (const key of Object.keys(parsed)) {
        if (Array.isArray(parsed[key])) return parsed[key]
      }
    }
  } catch (e) {
    // Continue to regex extraction
  }

  // 3. Regex extract the first array
  const match = cleaned.match(/\[[\s\S]*\]/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      if (Array.isArray(parsed)) return parsed
    } catch (e) {
      // Fall through
    }
  }

  // 4. Extract any JSON object with front/back pairs
  const objs = cleaned.match(/\{[^{}]*"front"[^{}]*\}/g)
  if (objs && objs.length > 0) {
    const cards: any[] = []
    for (const o of objs) {
      try {
        const parsed = JSON.parse(o)
        if (parsed.front && parsed.back) cards.push(parsed)
      } catch (e) {}
    }
    if (cards.length > 0) return cards
  }

  return []
}

export async function POST(req: Request) {
  try {
    const { courseId, topic } = await req.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Get materials (truncated, since we just need enough context)
    const { data: materials } = await supabase
      .from('materials').select('content').eq('course_id', courseId)
    if (!materials || materials.length === 0) {
      return NextResponse.json({ error: 'No materials found for this course.' }, { status: 400 })
    }

    const contextText = materials.map(m => m.content).join('\n\n').substring(0, 4000)

    // 2. Explicit JSON-only prompt
    const systemPrompt = `You are a JSON-only response engine.
Output a JSON array of exactly 8 flashcards about the topic "${topic}".
STRICT RULES:
- Output ONLY the JSON array. No explanation, no markdown, no backticks.
- Each card must have exactly two string fields: "front" and "back".
- Example: [{"front":"What is a loop?","back":"A repeating block of code."}]

TEXT TO USE:
${contextText}`

    // 3. Call Groq with JSON mode forced
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: systemPrompt }],
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: 'json_object' }  // Forces valid JSON
      })
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Groq API failed:', errorText)
      return NextResponse.json({ error: 'AI service unavailable. Try again.' }, { status: 500 })
    }

    const data = await res.json()
    const raw = data.choices[0].message.content

    console.log('Raw AI response (first 300 chars):', raw.substring(0, 300))

    // 4. Parse defensively
    let flashcards = parseFlashcards(raw)

    // 5. Filter malformed cards
    flashcards = flashcards.filter((c: any) =>
      c && typeof c.front === 'string' && typeof c.back === 'string' &&
      c.front.trim().length > 0 && c.back.trim().length > 0
    )

    if (flashcards.length === 0) {
      console.error('No valid flashcards parsed. Full raw:', raw)
      return NextResponse.json({
        error: 'AI could not produce flashcards on this topic. Try a more specific term (e.g. "recursion" instead of "programming").'
      }, { status: 422 })
    }

    // 6. Persist to database
    await supabaseAdmin.from('saved_flashcards').insert({
      student_id: user.id,
      course_id: courseId,
      topic,
      cards: flashcards
    })

    return NextResponse.json({ flashcards })

  } catch (error: any) {
    console.error('Flashcard generation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}