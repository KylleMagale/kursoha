"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, AlertTriangle, XCircle, Sparkles } from "lucide-react"

// Place this file at: src/app/dashboard/create/page.tsx

type MatchLevel = "Strong Match" | "Partial Match" | "Limited Match"

interface TailorResult {
  matchLevel: MatchLevel
  matchNote: string
  bulletPoints: string[]
  introMessage: string
}

// Visual treatment per match level — standard semantic colors (green/amber/
// red), not brand blue, since this is a status signal that needs to read
// as distinct from the rest of the UI at a glance.
const MATCH_STYLES: Record<
  MatchLevel,
  { bg: string; accent: string; text: string; iconBg: string; Icon: typeof CheckCircle2 }
> = {
  "Strong Match": {
    bg: "bg-emerald-50",
    accent: "bg-emerald-500",
    text: "text-emerald-800",
    iconBg: "bg-emerald-500",
    Icon: CheckCircle2,
  },
  "Partial Match": {
    bg: "bg-amber-50",
    accent: "bg-amber-500",
    text: "text-amber-800",
    iconBg: "bg-amber-500",
    Icon: AlertTriangle,
  },
  "Limited Match": {
    bg: "bg-red-50",
    accent: "bg-red-500",
    text: "text-red-800",
    iconBg: "bg-red-500",
    Icon: XCircle,
  },
}

export default function CreateResumePage() {
  const [jobDescription, setJobDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<TailorResult | null>(null)

  const handleTailor = async () => {
    if (!jobDescription.trim()) {
      setError("Paste a job description first.")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong.")
        return
      }

      setResult(data)
    } catch {
      setError("Network error. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const matchStyle = result ? MATCH_STYLES[result.matchLevel] : null

  return (
    <div className="min-h-screen bg-[#EFF2F9] px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#0F1E38] mb-2">Tailor a Resume</h1>
        <p className="text-sm text-[#425066] mb-6">
          Paste a job description below. Kursoha will honestly assess the fit, then generate
          tailored bullet points and a cover message using your profile.
        </p>

        <div className="bg-white rounded-2xl border-2 border-[#1B2A4A]/8 shadow-sm p-6">
          <label className="block text-sm font-medium text-[#0F1E38] mb-1.5">
            Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full min-h-[180px] border-2 border-[#1B2A4A]/10 rounded-lg p-3 text-sm text-[#0F1E38] focus:outline-none focus:border-[#1170CD]"
            placeholder="Paste the full job posting here..."
          />

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

          <button
            type="button"
            onClick={handleTailor}
            disabled={loading}
            className="mt-4 bg-[#1170CD] hover:bg-[#0F5FB3] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? "Checking fit & tailoring..." : "Tailor My Resume"}
          </button>
        </div>

        <AnimatePresence>
          {result && matchStyle && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-5 space-y-4"
            >
              {/* Match-level banner — redesigned: left accent bar, a solid
                  colored icon badge instead of a bare glyph, and the level
                  name as a small pill rather than a plain heading, so it
                  reads as a status component rather than placeholder text. */}
              <motion.div
                initial={{ scale: 0.97, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`relative overflow-hidden rounded-2xl ${matchStyle.bg} pl-5 pr-5 py-5`}
              >
                <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${matchStyle.accent}`} />
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 w-9 h-9 rounded-full ${matchStyle.iconBg} flex items-center justify-center`}>
                    <matchStyle.Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className={`inline-block text-xs font-bold uppercase tracking-wide ${matchStyle.text} mb-1`}>
                      {result.matchLevel}
                    </span>
                    <p className={`text-sm ${matchStyle.text} opacity-90 leading-relaxed`}>
                      {result.matchNote}
                    </p>
                  </div>
                </div>
              </motion.div>

              <div className="bg-white rounded-2xl border-2 border-[#1B2A4A]/8 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#0F1E38] mb-3">Tailored Bullet Points</h2>
                <ul className="space-y-2 mb-6">
                  {result.bulletPoints.map((point, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex gap-2 text-sm text-[#0F1E38]"
                    >
                      <span className="text-[#1170CD] mt-0.5">•</span>
                      <span>{point}</span>
                    </motion.li>
                  ))}
                </ul>

                <h2 className="text-lg font-semibold text-[#0F1E38] mb-2">Cover Message</h2>
                <p className="text-sm text-[#425066] leading-relaxed mb-5">{result.introMessage}</p>

                {/* AI-content disclaimer — deliberately neutral/quiet styling,
                    not alarming like the match banner above, since this is a
                    standing reminder rather than a situational warning. */}
                <div className="flex items-start gap-2 bg-[#1B2A4A]/[0.04] rounded-lg px-3.5 py-3">
                  <Sparkles className="w-4 h-4 text-[#6B7A90] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#6B7A90] leading-relaxed">
                    AI-generated content. Review for accuracy, tone, and truthfulness before
                    using it in an actual application — Kursoha tailors based on your profile,
                    but you know your experience best.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}