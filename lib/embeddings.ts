export async function generateEmbedding(text: string) {
  try {
    const response = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'jina-embeddings-v2-base-en',
        input: [text],
      }),
    })

    if (!response.ok) {
      throw new Error(`Jina API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error('Embedding generation failed:', error)
    return new Array(768).fill(0)
  }
}