'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function QuestionManager({
  initialQuestions,
  onQuestionsChange
}: {
  initialQuestions: any[],
  onQuestionsChange?: () => void
}) {
  const [questions, setQuestions] = useState(initialQuestions)
  const supabase = createClient()

  async function togglePublish(id: string, currentStatus: boolean) {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, published: !currentStatus } : q))

    const { error } = await supabase
      .from('questions')
      .update({ published: !currentStatus })
      .eq('id', id)

    if (error) {
      alert("Failed to update: " + error.message)
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, published: currentStatus } : q))
    } else if (onQuestionsChange) {
      onQuestionsChange()
    }
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Delete this question permanently?")) return

    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (error) {
      alert(error.message)
    } else {
      setQuestions(prev => prev.filter(q => q.id !== id))
      if (onQuestionsChange) onQuestionsChange()
    }
  }

  if (questions.length === 0) return null

  return (
    <div className="space-y-3">
      {questions.map((q, index) => (
        <div key={q.id} className={`p-4 border rounded-lg ${q.published ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-gray-800 flex-1 text-sm">
              {index + 1}. {q.question}
            </h4>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => togglePublish(q.id, q.published)}
                className={`px-3 py-1 text-xs rounded font-bold whitespace-nowrap ${
                  q.published
                    ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {q.published ? 'Unpublish' : 'Publish'}
              </button>
              <button
                onClick={() => deleteQuestion(q.id)}
                className="px-3 py-1 text-xs rounded font-bold bg-red-100 text-red-600 hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          </div>

          <ul className="space-y-1 mt-2">
            {q.options.map((opt: string, i: number) => (
              <li key={i} className={`text-sm p-1.5 rounded ${i === q.correct_index ? 'text-green-700 font-bold bg-white border border-green-200' : 'text-gray-600'}`}>
                {String.fromCharCode(65 + i)}. {opt} {i === q.correct_index && '✔'}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}