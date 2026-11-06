const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function askGroq(systemPrompt: string, userMessage: string) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.2 
    })
  })

  if (!res.ok) {
    const errorData = await res.text()
    throw new Error(`Groq API error: ${errorData}`)
  }

  const data = await res.json()
  return data.choices[0].message.content as string
}