'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('Logging in...')
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMsg(error.message)
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-screen flex font-sans">
      
      {/* LEFT SIDE: Institutional Branding (Deep Blue) */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-900 text-white flex-col justify-center p-16 relative overflow-hidden">
        {/* Abstract background shapes for modern look */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6">EduAssist <br/> Institutional</h1>
          <p className="text-blue-200 text-lg leading-relaxed max-w-md">
            The secure, curriculum-specific AI platform. 
            Sign in with your institutional credentials to access your faculty workspace or student portal.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-8">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-sm text-gray-500 mt-2">Log in to your workspace</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institution Domain</label>
              <div className="flex rounded-md shadow-sm">
                <input 
                  type="text" 
                  required 
                  placeholder="university.ac.ke"
                  className="flex-1 border p-2.5 rounded-l-md focus:outline-blue-500 text-black" 
                />
                <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm">
                  /
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full border p-2.5 rounded-md focus:outline-blue-500 text-black" 
                placeholder="name@university.ac.ke"
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
              className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors shadow-md mt-4"
            >
              Sign In
            </button>
          </form>
          
          {msg && <p className="mt-4 text-red-600 text-sm text-center font-medium">{msg}</p>}
          
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account? <Link href="/register" className="text-blue-600 hover:underline font-medium">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}