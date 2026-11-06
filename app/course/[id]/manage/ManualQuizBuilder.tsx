'use client'
import { useState } from 'react'

type Question = {
  question: string
  options: string[]
  correctIndex: number
}

export default function ManualQuizBuilder({ courseId, onSuccess }: { courseId: string, onSuccess: () => void }) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  function updateOption(i: number, value: string) {
    setOptions(prev => prev.map((o, idx) => idx === i ? value : o))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || options.some(o => !o.trim())) {
      return setMsg('All fields required')
    }

    setLoading(true)
    setMsg('Saving...')

    try {
      const res = await fetch('/api/manual-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, question, options, correctIndex })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setMsg('✅ Question added as draft.')
      setQuestion('')
      setOptions(['', '', '', ''])
      setCorrectIndex(0)
      onSuccess()

      setTimeout(() => setMsg(''), 2000)
    } catch (err: any) {
      setMsg(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        required
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Question text"
        className="w-full border p-2 rounded text-sm"
        disabled={loading}
      />
      {options.map((opt, i) => (
        <div key={i} className="flex gap-2 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="correct"
              checked={correctIndex === i}
              onChange={() => setCorrectIndex(i)}
              className="w-4 h-4"
            />
            <span className="text-sm font-bold text-gray-600">{String.fromCharCode(65 + i)}</span>
          </label>
          <input
            value={opt}
            onChange={e => updateOption(i, e.target.value)}
            placeholder={`Option ${String.fromCharCode(65 + i)}`}
            className="flex-1 border p-2 rounded text-sm"
            disabled={loading}
          />
        </div>
      ))}
      <p className="text-xs text-gray-500">Radio = correct answer</p>
      <button
        type="submit"
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 font-medium w-full text-sm"
      >
        {loading ? 'Saving...' : 'Add Question as Draft'}
      </button>
      {msg && (
        <p className={`text-sm font-medium ${msg.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>
          {msg}
        </p>
      )}
    </form>
  )
}