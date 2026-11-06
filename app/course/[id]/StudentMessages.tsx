'use client'
import { useState, useEffect, useRef } from 'react'

type Props = {
  classId: string | null
  lecturerId: string | null
  lecturerName: string
}

export default function StudentMessages({ classId, lecturerId, lecturerName }: Props) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function loadMessages() {
    if (!classId || !lecturerId) return
    const res = await fetch(`/api/messages?peerId=${lecturerId}&classId=${classId}`)
    const data = await res.json()
    setMessages(data.messages || [])
  }

  useEffect(() => {
    loadMessages()
  }, [classId, lecturerId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !lecturerId || !classId) return
    setLoading(true)

    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: lecturerId, classId, content: input })
    })

    setInput('')
    await loadMessages()
    setLoading(false)
  }

  if (!classId || !lecturerId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">You are not enrolled in this course, or no lecturer has been assigned yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b p-4">
        <h3 className="font-bold text-gray-800">Messages with {lecturerName}</h3>
        <p className="text-xs text-gray-500">Ask your lecturer anything about this course.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-8">No messages yet. Say hi!</p>
        )}
        {messages.map(m => {
          const isFromMe = m.sender_id !== lecturerId
          return (
            <div
              key={m.id}
              className={`p-3 rounded-lg max-w-[80%] text-sm ${
                isFromMe ? 'bg-purple-600 text-white ml-auto' : 'bg-white border text-gray-800'
              }`}
            >
              {m.content}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t bg-white flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border p-2 rounded text-sm"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-purple-600 text-white px-5 py-2 rounded font-bold text-sm hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  )
}