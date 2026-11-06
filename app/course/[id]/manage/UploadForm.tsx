'use client'
import { useState } from 'react'

export default function UploadForm({ courseId, unitId }: { courseId: string, unitId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setStatus('uploading')
    setMessage('Uploading file...')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('courseId', courseId)
    formData.append('unitId', unitId)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        if (res.status === 413) {
          throw new Error('File is too large. Vercel limits uploads to 4MB.')
        }
        throw new Error(`Server error (${res.status}). The file may be too large or the server timed out.`)
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(`${data.error} | ${data.details || ''}`)
      }

      setStatus('success')
      setMessage(data.message || 'File processed successfully!')
      setFile(null)
      
      // Wait 5 seconds for the background AI to finish before reloading
      setTimeout(() => window.location.reload(), 5000) 
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  return (
    <form onSubmit={handleUpload} className="flex flex-col gap-3">
      <input
        type="file"
        accept=".pdf,.txt,image/png,image/jpeg"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      <button
        type="submit"
        disabled={!file || status === 'uploading'}
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 w-fit font-medium"
      >
        {status === 'uploading' ? 'Uploading...' : 'Upload & Process'}
      </button>

      {message && (
        <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </form>
  )
}