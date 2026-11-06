'use client'
import { useState, useEffect } from 'react'

export default function AnalyticsPanel({ courseId }: { courseId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/analytics?courseId=${courseId}&scope=faculty`)
      if (res.ok) {
        setData(await res.json())
      }
      setLoading(false)
    }
    load()
  }, [courseId])

  if (loading) return <p className="text-sm text-gray-500 bg-white p-4 rounded-lg border">Loading analytics...</p>
  if (!data) return <p className="text-sm text-gray-500 bg-white p-4 rounded-lg border">No data available.</p>

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase">Class Average</p>
          <p className={`text-3xl font-extrabold mt-1 ${
            data.classAverage >= 70 ? 'text-green-600' : data.classAverage >= 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {data.classAverage}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase">Total Attempts</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{data.totalAttempts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase">Active Students</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{data.uniqueStudents}</p>
        </div>
      </div>

      {/* Per-Question Breakdown */}
      <div>
        <h3 className="font-semibold text-lg text-gray-800 mb-2">Per-Question Performance</h3>
        {data.perQuestion.length === 0 ? (
          <p className="text-sm text-gray-500 bg-white p-4 rounded-lg border">No published questions yet.</p>
        ) : (
          <div className="space-y-2">
            {data.perQuestion.map((q: any, i: number) => {
              const isWeak = q.percentage < 50 && q.totalAttempts > 0
              return (
                <div key={q.id} className={`p-4 rounded-lg border ${isWeak ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm text-gray-800 flex-1">
                      {i + 1}. {q.question}
                    </h4>
                    <div className="text-right ml-4">
                      <p className={`text-lg font-extrabold ${
                        q.percentage >= 70 ? 'text-green-600' : q.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {q.percentage}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {q.correctCount}/{q.totalAttempts} correct
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full ${
                        q.percentage >= 70 ? 'bg-green-500' : q.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${q.percentage}%` }}
                    />
                  </div>

                  {isWeak && (
                    <p className="text-xs text-red-700 font-bold mt-2">
                      ⚠️ {q.percentage}% of attempts got this wrong — consider re-teaching this concept.
                    </p>
                  )}

                  {q.totalAttempts === 0 && (
                    <p className="text-xs text-gray-400 italic mt-1">No attempts yet.</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}