'use client'
import { useState } from 'react'

export default function UploadForm({ courseId }: { courseId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setStatus('uploading')
    setMessage('Reading and saving file...')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('courseId', courseId)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setStatus('success')
      setMessage('File processed successfully!')
      setFile(null) // clear input
      // Force reload to show the new file in the list
      window.location.reload() 
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  return (
    <form onSubmit={handleUpload} className="flex flex-col gap-3">
      <input
        type="file"
        accept=".pdf,.txt"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      <button
        type="submit"
        disabled={!file || status === 'uploading'}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 w-fit"
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