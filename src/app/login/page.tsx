"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

// Place this file at: src/app/login/page.tsx

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; confirm?: string }>({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  const validate = () => {
    const errors: typeof fieldErrors = {}
    if (!email.trim()) errors.email = "Enter your email."
    else if (!isValidEmail(email)) errors.email = "Enter a valid email address."

    if (!password) errors.password = "Enter a password."
    else if (isSignUp && password.length < 6) errors.password = "Password must be at least 6 characters."

    if (isSignUp && password !== confirmPassword) errors.confirm = "Passwords don't match."

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!validate()) return

    setLoading(true)
    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (authError) setError(authError.message)
    else router.push("/dashboard")
  }

  const switchMode = () => {
    setIsSignUp(!isSignUp)
    setError("")
    setFieldErrors({})
    setConfirmPassword("")
  }

  return (
    <div className="min-h-screen bg-[#EFF2F9] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <img src="/logo.svg" alt="Kursoha" className="h-15 w-auto" />
        </div>

        <div className="bg-white rounded-2xl border-2 border-[#1B2A4A]/8 shadow-sm p-7 sm:p-8">
          <h1 className="text-xl font-semibold text-[#0F1E38] text-center mb-1">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-[#425066] text-center mb-6">
            {isSignUp ? "Start tailoring resumes in minutes." : "Log in to continue to Kursoha."}
          </p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border-2 border-[#1B2A4A]/12 rounded-lg py-2.5 text-sm font-semibold text-[#0F1E38] hover:bg-[#F3F6FB] transition-colors disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-[#1B2A4A]/10 flex-1" />
            <span className="text-xs text-[#6B7A90]">or</span>
            <div className="h-px bg-[#1B2A4A]/10 flex-1" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#0F1E38] mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input ${fieldErrors.email ? "input-error" : ""}`}
                placeholder="you@email.com"
              />
              {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#0F1E38] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`input pr-10 ${fieldErrors.password ? "input-error" : ""}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A90] hover:text-[#0F1E38]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-[#0F1E38] mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`input ${fieldErrors.confirm ? "input-error" : ""}`}
                  placeholder="••••••••"
                />
                {fieldErrors.confirm && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirm}</p>}
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1170CD] hover:bg-[#0F5FB3] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? (isSignUp ? "Creating account..." : "Logging in...") : isSignUp ? "Sign Up" : "Log In"}
            </button>
          </form>

          <button
            type="button"
            onClick={switchMode}
            className="w-full text-center text-sm text-[#1170CD] font-medium mt-5"
          >
            {isSignUp ? "Already have an account? Log in" : "No account? Sign up"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 2px solid rgba(27, 42, 74, 0.1);
          border-radius: 0.5rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.9rem;
          color: #0f1e38;
          background: white;
        }
        .input:focus {
          outline: none;
          border-color: #1170cd;
        }
        .input-error {
          border-color: #ef4444;
        }
      `}</style>
    </div>
  )
}