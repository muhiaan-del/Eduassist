import { createClient } from '@supabase/supabase-js'

export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  try {
    const base64Image = imageBuffer.toString('base64')
    
    // Call Groq Vision API
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: 'Transcribe all text from this image accurately. Output ONLY the extracted text. Do not add any commentary or markdown formatting.' 
              },
              { 
                type: 'image_url', 
                image_url: { url: `data:image/jpeg;base64,${base64Image}` } 
              }
            ]
          }
        ],
        temperature: 0.1
      })
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[groq-vision] API Error:', errorText)
      throw new Error(`Groq Vision API failed: ${res.status}`)
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ''
    
    if (!text || text.trim() === '') {
      throw new Error('Groq Vision returned no text.')
    }

    return text
  } catch (error: any) {
    console.error('[groq-vision] Extraction failed:', error)
    throw error
  }
}