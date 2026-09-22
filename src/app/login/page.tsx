'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) setError(error.message)
    else router.push('/dashboard')
  }

  return (
    <div className="max-w-sm mx-auto mt-20 space-y-4">
      <h1 className="text-2xl font-bold">{isSignUp ? 'Sign Up' : 'Log In'} — Kursoha</h1>

      <button onClick={handleGoogleLogin} className="w-full border p-2 rounded">
        Continue with Google
      </button>

      <div className="text-center text-sm text-gray-500">or</div>

      <form onSubmit={handleEmailAuth} className="space-y-2">
        <input type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} className="w-full border p-2 rounded" required />
        <input type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} className="w-full border p-2 rounded" required />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-black text-white p-2 rounded">
          {isSignUp ? 'Sign Up' : 'Log In'}
        </button>
      </form>

      <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-blue-500 underline">
        {isSignUp ? 'Already have an account? Log in' : "No account? Sign up"}
      </button>
    </div>
  )
}