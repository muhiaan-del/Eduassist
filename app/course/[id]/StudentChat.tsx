'use client'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function StudentChat({ courseId }: { courseId: string }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string, citations?: any[], suggestions?: string[] }[]>([])
  const [input, setInput] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() && !image) return

    let questionText = input.trim()
    setInput('')
    setLoading(true)

    // If an image is attached, extract text via a dedicated endpoint
    if (image) {
      const fd = new FormData()
      fd.append('file', image)
      fd.append('courseId', courseId)
      const ocrRes = await fetch('/api/ocr-chat', { method: 'POST', body: fd })
      const ocrData = await ocrRes.json()
      if (ocrRes.ok && ocrData.text) {
        questionText += `\n\n[Image content]: ${ocrData.text}`
      }
      setImage(null)
    }

    setMessages(prev => [...prev, { role: 'user', text: questionText }])

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, question: questionText })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get answer')

      setMessages(prev => [...prev, {
        role: 'ai',
        text: data.answer,
        citations: data.citations,
        suggestions: data.suggestions
      }])
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 mt-10">Ask a question, or upload a photo of a problem.</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
              msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border shadow-sm rounded-bl-none overflow-x-auto'
            }`}>
              {msg.role === 'user' ? msg.text : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-bold text-gray-500 mb-1">Sources:</p>
                      <ul className="text-xs text-gray-500">
                        {msg.citations.map((c, ci) => (
                          <li key={ci}><strong>{c.ref}</strong> {c.snippet}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-bold text-gray-500 mb-2">Try asking:</p>
                      <div className="flex flex-wrap gap-2">
                        {msg.suggestions.map((s, si) => (
                          <button
                            key={si}
                            onClick={() => setInput(s)}
                            className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100 font-medium"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border shadow-sm p-3 rounded-lg rounded-bl-none text-gray-500 text-sm italic">
              Searching course notes...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t bg-white flex gap-2 items-center">
        <input
          type="file"
          accept="image/*"
          onChange={e => setImage(e.target.files?.[0] || null)}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="cursor-pointer bg-gray-100 p-2 rounded hover:bg-gray-200" title="Upload a photo">
          📷
        </label>
        <input
          className="flex-1 border p-2 rounded text-black focus:outline-blue-500"
          placeholder={image ? 'Image attached' : 'Ask a question...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || (!input.trim() && !image)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}