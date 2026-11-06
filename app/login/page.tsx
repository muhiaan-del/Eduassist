'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // HARDCODED INSTITUTION DETAILS (In production, this would be dynamic based on the URL)
  const INSTITUTION_NAME = 'Tech University'
  const INSTITUTION_DOMAIN = 'techuniversity.ac.ke'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg('Authenticating...')

    try {
      // 1. Attempt login
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        setMsg(error.message)
        setLoading(false)
        return
      } 

      if (authData.user) {
        setMsg('Verifying profile...')

        // 2. Fetch the user's profile (Now including requires_password_change)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, institution_id, requires_password_change')
          .eq('id', authData.user.id)
          .single()

        if (profileError || !profile) {
          await supabase.auth.signOut()
          setMsg(`❌ Profile Error: ${profileError?.message || 'No profile found.'}`)
          setLoading(false)
          return
        }

        // 3. Force password change if they are using a temporary password
        if (profile.requires_password_change) {
          window.location.href = '/update-password'
          return
        }

        // 4. Redirect based on their role
        setMsg(`Redirecting to ${profile.role} dashboard...`)
        
        if (profile.role === 'admin') {
          window.location.href = '/dashboard/institution'
        } else {
          window.location.href = '/dashboard'
        }
      } else {
        setMsg('Login failed: No user data returned.')
        setLoading(false)
      }
    } catch (err: any) {
      setMsg(`❌ Unexpected Error: ${err.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex font-sans">
      
      {/* LEFT SIDE: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-900 text-white flex-col justify-center p-16 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6">
            {INSTITUTION_NAME} <br/> Institutional Portal
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed max-w-md">
            The secure, curriculum-specific AI platform. 
            Sign in with your institutional credentials to access your workspace.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-8">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          
          <div className="text-center mb-8">
            {/* HARDCODED DOMAIN BADGE */}
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mb-4">
              @{INSTITUTION_DOMAIN}
            </span>
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-sm text-gray-500 mt-2">Log in to your workspace</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full border p-2.5 rounded-md focus:outline-blue-500 text-black" 
                placeholder={`name@${INSTITUTION_DOMAIN}`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full border p-2.5 rounded-md focus:outline-blue-500 text-black" 
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors shadow-md mt-4 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
          
          {msg && <p className="mt-4 text-red-600 text-sm text-center font-medium bg-red-50 p-2 rounded">{msg}</p>}
          
          <p className="mt-6 text-center text-sm text-gray-600">
            Need help? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}