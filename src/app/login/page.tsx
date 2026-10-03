"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Place this file at: src/app/login/page.tsx

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const buttonTap = {
  scale: 0.97,
}

const buttonHover = {
  scale: 1.01,
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
    confirm?: string
  }>({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  const validate = () => {
    const errors: typeof fieldErrors = {}

    if (!email.trim()) {
      errors.email = "Enter your email."
    } else if (!isValidEmail(email)) {
      errors.email = "Enter a valid email address."
    }

    if (!password) {
      errors.password = "Enter a password."
    } else if (isSignUp && password.length < 6) {
      errors.password = "Password must be at least 6 characters."
    }

    if (isSignUp && password !== confirmPassword) {
      errors.confirm = "Passwords don't match."
    }

    setFieldErrors(errors)

    return Object.keys(errors).length === 0
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validate()) return

    setLoading(true)

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
        })
      : await supabase.auth.signInWithPassword({
          email,
          password,
        })

    setLoading(false)

    if (authError) {
      setError(authError.message)
    } else {
      router.push("/dashboard")
    }
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

        {/* Logo */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <motion.img
            src="/logo.svg"
            alt="Kursoha"
            className="h-15 w-auto"
            whileHover={{
              scale: 1.03,
            }}
            transition={{
              duration: 0.2,
            }}
          />
        </motion.div>

        {/* Card */}
        <motion.div
          layout
          className="bg-white rounded-2xl border-2 border-[#1B2A4A]/8 shadow-sm p-7 sm:p-8"
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            delay: 0.05,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? "signup-heading" : "login-heading"}
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              transition={{
                duration: 0.2,
              }}
            >
              <h1 className="text-xl font-semibold text-[#0F1E38] text-center mb-1">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h1>

              <p className="text-sm text-[#425066] text-center mb-6">
                {isSignUp
                  ? "Start tailoring resumes in minutes."
                  : "Log in to continue to Kursoha."}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Google Button */}
          <motion.button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            whileHover={buttonHover}
            whileTap={buttonTap}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
            }}
            className="w-full flex items-center justify-center gap-3 border-2 border-[#1B2A4A]/12 rounded-lg py-2.5 text-sm font-semibold text-[#0F1E38] hover:bg-[#F3F6FB] transition-colors disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin" />
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"
                />
              </svg>
            )}

            {googleLoading ? "Connecting..." : "Continue with Google"}
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-[#1B2A4A]/10 flex-1" />

            <span className="text-xs text-[#6B7A90]">
              or
            </span>

            <div className="h-px bg-[#1B2A4A]/10 flex-1" />
          </div>

          {/* Form */}
          <form
            onSubmit={handleEmailAuth}
            className="space-y-4"
            noValidate
          >
            {/* Email */}
            <motion.div
              layout
              initial={false}
              animate={{
                opacity: 1,
              }}
            >
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#0F1E38] mb-1.5"
              >
                Email
              </label>

              <motion.input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                whileFocus={{
                  scale: 1.005,
                }}
                transition={{
                  duration: 0.15,
                }}
                className={`input ${
                  fieldErrors.email ? "input-error" : ""
                }`}
                placeholder="you@email.com"
              />

              <AnimatePresence>
                {fieldErrors.email && (
                  <motion.p
                    initial={{
                      opacity: 0,
                      height: 0,
                      y: -4,
                    }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      y: -4,
                    }}
                    className="text-xs text-red-500 mt-1 overflow-hidden"
                  >
                    {fieldErrors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Password */}
            <motion.div layout>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#0F1E38] mb-1.5"
              >
                Password
              </label>

              <div className="relative">
                <motion.input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  whileFocus={{
                    scale: 1.005,
                  }}
                  transition={{
                    duration: 0.15,
                  }}
                  className={`input pr-10 ${
                    fieldErrors.password ? "input-error" : ""
                  }`}
                  placeholder="••••••••"
                />

                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  whileTap={{
                    scale: 0.85,
                  }}
                  whileHover={{
                    scale: 1.1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 15,
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A90] hover:text-[#0F1E38]"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </motion.button>
              </div>

              <AnimatePresence>
                {fieldErrors.password && (
                  <motion.p
                    initial={{
                      opacity: 0,
                      height: 0,
                      y: -4,
                    }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      y: -4,
                    }}
                    className="text-xs text-red-500 mt-1 overflow-hidden"
                  >
                    {fieldErrors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Confirm Password */}
            <AnimatePresence initial={false}>
              {isSignUp && (
                <motion.div
                  layout
                  initial={{
                    opacity: 0,
                    height: 0,
                    y: -8,
                  }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                    y: -8,
                  }}
                  transition={{
                    duration: 0.25,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="overflow-hidden"
                >
                  <label
                    htmlFor="confirm"
                    className="block text-sm font-medium text-[#0F1E38] mb-1.5"
                  >
                    Confirm Password
                  </label>

                  <motion.input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    whileFocus={{
                      scale: 1.005,
                    }}
                    transition={{
                      duration: 0.15,
                    }}
                    className={`input ${
                      fieldErrors.confirm ? "input-error" : ""
                    }`}
                    placeholder="••••••••"
                  />

                  <AnimatePresence>
                    {fieldErrors.confirm && (
                      <motion.p
                        initial={{
                          opacity: 0,
                          height: 0,
                          y: -4,
                        }}
                        animate={{
                          opacity: 1,
                          height: "auto",
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                          height: 0,
                          y: -4,
                        }}
                        className="text-xs text-red-500 mt-1 overflow-hidden"
                      >
                        {fieldErrors.confirm}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* General Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{
                    opacity: 0,
                    y: -5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -5,
                  }}
                  className="text-sm text-red-500"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? buttonHover : undefined}
              whileTap={!loading ? buttonTap : undefined}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
              }}
              className="w-full bg-[#1170CD] hover:bg-[#0F5FB3] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}

              {loading
                ? isSignUp
                  ? "Creating account..."
                  : "Logging in..."
                : isSignUp
                  ? "Sign Up"
                  : "Log In"}
            </motion.button>
          </form>

          {/* Switch Login / Signup */}
          <motion.button
            type="button"
            onClick={switchMode}
            whileTap={{
              scale: 0.97,
            }}
            whileHover={{
              scale: 1.02,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
            }}
            className="w-full text-center text-sm text-[#1170CD] font-medium mt-5"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={isSignUp ? "login" : "signup"}
                initial={{
                  opacity: 0,
                  y: 5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -5,
                }}
                transition={{
                  duration: 0.18,
                }}
                className="inline-block"
              >
                {isSignUp
                  ? "Already have an account? Log in"
                  : "No account? Sign up"}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </motion.div>
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
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background-color 0.2s ease;
        }

        .input:hover {
          border-color: rgba(27, 42, 74, 0.18);
        }

        .input:focus {
          outline: none;
          border-color: #1170cd;
          box-shadow: 0 0 0 3px rgba(17, 112, 205, 0.1);
        }

        .input-error {
          border-color: #ef4444;
        }

        .input-error:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </div>
  )
}
