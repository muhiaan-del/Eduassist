'use client'
import { useState, useEffect, useRef } from 'react'

export default function MessagesPanel({ courseId, students, classes }: { courseId: string, students: any[], classes: any[] }) {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiDrafting, setAiDrafting] = useState(false)
  const [copilotMsg, setCopilotMsg] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const classStudents = students.filter(s => s.class_id === selectedClassId)

  async function loadMessages(studentId: string) {
    const res = await fetch(`/api/messages?peerId=${studentId}&classId=${selectedClassId}`)
    const data = await res.json()
    setMessages(data.messages || [])
  }

  useEffect(() => {
    if (selectedStudent) loadMessages(selectedStudent.id)
  }, [selectedStudent, selectedClassId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || !selectedStudent) return
    setLoading(true)

    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: selectedStudent.id, classId: selectedClassId, content: input })
    })

    setInput('')
    setCopilotMsg('')
    loadMessages(selectedStudent.id)
    setLoading(false)
  }

  async function draftWithAI() {
    if (!input.trim() || !selectedStudent) return
    setAiDrafting(true)
    const res = await fetch('/api/smart-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, studentMessage: input })
    })
    const data = await res.json()
    if (res.ok) {
      setInput(data.draft)
      setCopilotMsg('✨ Copilot drafted this reply. Review before sending.')
    }
    setAiDrafting(false)
  }

  // Should the Copilot button be pulsing?
  const shouldFlash = !!input.trim() && !aiDrafting

  return (
    <div className="bg-white border rounded-xl shadow-sm p-6">
      <h3 className="font-bold text-lg text-gray-800 mb-4">Student Messages</h3>

      <div className="mb-3">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Class</label>
        <select
          value={selectedClassId}
          onChange={e => { setSelectedClassId(e.target.value); setSelectedStudent(null); setMessages([]); setInput('') }}
          className="w-full border rounded p-2 text-sm mt-1"
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.unit_code})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[28rem]">

        {/* Student List */}
        <div className="border rounded-lg overflow-y-auto">
          {classStudents.length === 0 ? (
            <p className="text-sm text-gray-500 p-4">No students in this class.</p>
          ) : (
            classStudents.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelectedStudent(s); setInput(''); setCopilotMsg('') }}
                className={`w-full text-left p-3 border-b hover:bg-gray-50 text-sm ${selectedStudent?.id === s.id ? 'bg-blue-50 font-bold' : ''}`}
              >
                {s.full_name}
              </button>
            ))
          )}
        </div>

        {/* Chat Panel */}
        <div className="md:col-span-2 border rounded-lg flex flex-col">
          {!selectedStudent ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a student to start messaging
            </div>
          ) : (
            <>
              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length > 0 && !input && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-900 mb-4">
                    <p className="font-bold flex items-center gap-2">
                      <span>✨</span> Try EduAssist Copilot
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                      Type a rough thought below and click <strong>Ask Copilot to Draft</strong> to get an AI-polished reply based on your course materials.
                    </p>
                  </div>
                )}
                {messages.map(m => (
                  <div
                    key={m.id}
                    className={`p-2 rounded-lg max-w-[80%] text-sm ${m.sender_id === selectedStudent.id ? 'bg-white border' : 'bg-blue-600 text-white ml-auto'}`}
                  >
                    {m.content}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              <div className="p-3 border-t">
                {copilotMsg && (
                  <p className="text-xs text-purple-700 bg-purple-50 p-2 rounded mb-2 font-medium">
                    {copilotMsg}
                  </p>
                )}
                <textarea
                  value={input}
                  onChange={e => { setInput(e.target.value); setCopilotMsg('') }}
                  rows={3}
                  className="w-full border rounded p-2 text-sm mb-2"
                  placeholder={`Explain to ${selectedStudent.full_name}...`}
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <button
                      onClick={draftWithAI}
                      disabled={aiDrafting || !input.trim()}
                      className={`relative text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 shadow-sm transition-all flex items-center gap-2 ${
                        shouldFlash ? 'animate-pulse ring-2 ring-purple-300' : ''
                      }`}
                    >
                      {aiDrafting ? (
                        <>
                          <span className="animate-spin">⟳</span> Copilot is drafting...
                        </>
                      ) : (
                        <>✨ Ask Copilot to Draft</>
                      )}
                    </button>
                    <span className="text-[10px] text-gray-500 mt-1 italic pl-1">
                      Reads your course materials & writes a reply
                    </span>
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="text-sm bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                  >
                    {loading ? 'Sending...' : `Send to ${selectedStudent.full_name.split(' ')[0]}`}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}