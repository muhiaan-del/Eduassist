'use client'
import { useEffect, useState, useRef } from 'react'
import { LiveKitRoom, RoomAudioRenderer, useParticipants } from '@livekit/components-react'
import '@livekit/components-styles'

export default function LiveRoom({ roomName, role, title }: { roomName: string, role: string, title: string }) {
  const [token, setToken] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  
  // Ref to prevent double-fetching in React Strict Mode
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    async function getToken() {
      try {
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName, role })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to get token')
        
        setToken(data.token)
        setUrl(data.url)
      } catch (err: any) {
        setError(err.message)
      }
    }
    getToken()
  }, [roomName, role])

  // Mark session as live when host connects
  useEffect(() => {
    if (role === 'host' && token) {
      fetch('/api/livekit/mark-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName })
      }).catch(err => console.error('Failed to mark live:', err))
    }
  }, [role, token, roomName])

  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>
  if (!token || !url) return <div className="p-8 text-center text-gray-500">Connecting to live session...</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="bg-red-600 px-6 py-3 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">🔴 LIVE</span>
          <span className="ml-3 font-bold text-lg">{title}</span>
        </div>
        <span className="text-sm">{role === 'host' ? 'You are the host' : 'Listening'}</span>
      </div>

      <LiveKitRoom
        token={token}
        serverUrl={url}
        connect={true}
        audio={role === 'host'}
        video={false}
        onDisconnected={() => console.log('Disconnected from LiveKit')}
        onConnected={() => console.log('Connected to LiveKit')}
      >
        <RoomAudioRenderer />
        <ParticipantList />
      </LiveKitRoom>
    </div>
  )
}

function ParticipantList() {
  const participants = useParticipants()
  return (
    <div className="flex-1 p-6">
      <h2 className="text-xl font-bold mb-4">In this session ({participants.length})</h2>
      <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {participants.map(p => (
          <li key={p.identity} className="bg-gray-800 p-4 rounded-lg text-center">
            <p className="font-medium">{p.name || p.identity.slice(0, 8)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {p.isSpeaking ? '🎤 Speaking' : p.isLocal ? 'You' : 'Listening'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}