"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

// Place this file at: src/app/dashboard/create/page.tsx
//
// Minimal page to test the /api/tailor route end-to-end: paste a job
// description, hit Tailor, see the generated bullet points + intro message.
// This is intentionally bare-bones — the full split-screen live-preview
// editor (from the resume-builder flow plan) comes next, built on top of
// this working API call.

interface TailorResult {
bulletPoints: string[]
introMessage: string
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

return (
<div className="min-h-screen bg-[#EFF2F9] px-6 py-12">
<div className="max-w-2xl mx-auto">
<h1 className="text-2xl font-semibold text-[#0F1E38] mb-2">
Tailor a Resume
</h1>

    <p className="text-sm text-[#425066] mb-6">
      Paste a job description below. Kursoha will generate tailored bullet
      points and a cover message using your profile.
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

      {error && (
        <p className="text-sm text-red-500 mt-2">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleTailor}
        disabled={loading}
        className="mt-4 bg-[#1170CD] hover:bg-[#0F5FB3] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {loading ? "Tailoring..." : "Tailor My Resume"}
      </button>
    </div>

    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl border-2 border-[#1B2A4A]/8 shadow-sm p-6 mt-5"
        >
          <h2 className="text-lg font-semibold text-[#0F1E38] mb-3">
            Tailored Bullet Points
          </h2>

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

          <h2 className="text-lg font-semibold text-[#0F1E38] mb-2">
            Cover Message
          </h2>

          <p className="text-sm text-[#425066] leading-relaxed">
            {result.introMessage}
          </p>

          {/* AI review notice */}
          <div className="mt-5 pt-4 border-t border-[#1B2A4A]/8">
            <p className="text-xs text-[#6B778C] leading-relaxed">
              <span className="mr-1">ⓘ</span>
              <span className="font-medium">AI-generated content.</span>{" "}
              Please review and verify all details before using or
              submitting your application.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
</div>


)
}