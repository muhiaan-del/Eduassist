'use client'
import { useState, useEffect } from 'react'

export default function StudentProgress({ courseId }: { courseId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/analytics?courseId=${courseId}&scope=student`)
      if (res.ok) {
        setData(await res.json())
      }
      setLoading(false)
    }
    load()
  }, [courseId])

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your progress...</div>
  if (!data || data.history.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">You haven't taken any quizzes yet. Try the Practice Quiz tab!</p>
      </div>
    )
  }

  // Calculate overall trend
  const recent = data.history.slice(0, 5)
  const avgRecent = Math.round(recent.reduce((s: number, h: any) => s + h.percentage, 0) / recent.length)
  const oldest = data.history[data.history.length - 1]?.percentage || 0

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">My Progress</h2>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase">Recent Average (last 5)</p>
            <p className={`text-3xl font-extrabold mt-1 ${
              avgRecent >= 70 ? 'text-green-600' : avgRecent >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {avgRecent}%
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase">Total Attempts</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{data.history.length}</p>
          </div>
        </div>

        {/* History */}
        <div>
          <h3 className="font-semibold text-lg text-gray-800 mb-3">Attempt History</h3>
          <ul className="space-y-2">
            {data.history.map((h: any, i: number) => (
              <li key={i} className="bg-white p-4 rounded-lg border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{new Date(h.date).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">{h.correct} of {h.total} correct</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-extrabold ${
                    h.percentage >= 70 ? 'text-green-600' : h.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {h.percentage}%
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}