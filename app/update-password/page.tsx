'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) return setMsg("Passwords do not match.")
    if (password.length < 6) return setMsg("Password must be at least 6 characters.")

    setLoading(true)
    setMsg('Updating password...')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return setMsg('Not logged in.')

    // 1. Update Auth Password
    const { error: authError } = await supabase.auth.updateUser({ password })
    if (authError) return setMsg(authError.message)

    // 2. Remove the "requires_password_change" flag
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ requires_password_change: false })
      .eq('id', user.id)

    if (profileError) return setMsg(profileError.message)

    // 3. Redirect to dashboard
    setMsg('✅ Password updated! Redirecting...')
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Set Your Password</h2>
        <p className="text-sm text-gray-500 mb-6 text-center">You are using a temporary password. Please create a new personal password to continue.</p>
        
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2.5 rounded-md text-black" placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full border p-2.5 rounded-md text-black" placeholder="Re-enter password" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 mt-2">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        {msg && (
          <div className={`mt-4 p-3 rounded text-sm text-center font-bold ${msg.includes('❌') || msg.includes('must') || msg.includes('match') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  )
}