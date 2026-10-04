"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import type { JobEntryForm } from "@/app/onboarding/page"
import type { ExperienceEntry } from "@/components/resume/template1"

type MatchLevel = "Strong Match" | "Partial Match" | "Limited Match"

interface TailorResult {
  matchLevel: MatchLevel
  matchNote: string
  experience: { bullets: string[] }[]
  introMessage: string
}

interface ProfileLite {
  fullName: string
  email: string
  phone: string
  skills: string
  jobs: JobEntryForm[]
}

export default function CreateResumePage() {
  const router = useRouter()
  const [jobDescription, setJobDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [profile, setProfile] = useState<ProfileLite | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, skills_summary, work_experience")
        .eq("user_id", user.id)
        .maybeSingle()

      if (data) {
        setProfile({
          fullName: data.full_name ?? "",
          email: user.email ?? "",
          phone: data.phone ?? "",
          skills: data.skills_summary ?? "",
          jobs: Array.isArray(data.work_experience) ? data.work_experience : [],
        })
      }
    }
    loadProfile()
  }, [])

  const handleTailor = async () => {
    if (!jobDescription.trim()) {
      setError("Paste a job description first.")
      return
    }
    if (!profile || profile.jobs.length === 0) {
      setError("Add at least one job in Onboarding before tailoring.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      })

      const data: TailorResult & { error?: string } = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong.")
        return
      }

      // Zip the AI's bullets back onto the real job metadata — the AI
      // never sees or returns title/company/location/dates, so those are
      // always exactly what the user entered.
      const tailoredExperience: ExperienceEntry[] = profile.jobs.map((job, i) => ({
        title: job.title,
        company: job.company,
        location: job.location || undefined,
        period: job.period || undefined,
        bullets: data.experience[i]?.bullets ?? [],
      }))

      setSaving(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError("Your session expired. Please log in again.")
        return
      }

      const { data: saved, error: saveError } = await supabase
        .from("resume_versions")
        .insert({
          user_id: user.id,
          job_description: jobDescription,
          match_level: data.matchLevel,
          match_note: data.matchNote,
          tailored_experience: tailoredExperience,
          intro_message: data.introMessage,
          template_id: "template1",
        })
        .select("id")
        .single()

      if (saveError || !saved) {
        console.error("Failed to save resume version:", saveError)
        setError("Tailoring succeeded, but saving the result failed. Please try again.")
        return
      }

      router.push(`/dashboard/review/${saved.id}`)
    } catch {
      setError("Network error. Check your connection and try again.")
    } finally {
      setLoading(false)
      setSaving(false)
    }
  }

  const busy = loading || saving

  return (
    <div className="min-h-screen bg-[#EFF2F9] px-4 sm:px-6 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl mx-auto"
      >
        <h1 className="text-2xl font-semibold text-[#0F1E38] mb-2">Tailor a Resume</h1>
        <p className="text-sm text-[#425066] mb-6">
          Paste a job description below. Kursoha will honestly assess the fit, then generate
          tailored bullet points for each job using your profile.
        </p>

        {profile && profile.jobs.length === 0 && (
          <div className="mb-4 flex items-start gap-2 bg-amber-50 rounded-lg px-3.5 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              You don&apos;t have any work experience saved yet. Add at least one job in
              Onboarding first.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl border-2 border-[#1B2A4A]/8 shadow-sm p-6">
          <label className="block text-sm font-medium text-[#0F1E38] mb-1.5">
            Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            disabled={busy}
            className="w-full min-h-[180px] border-2 border-[#1B2A4A]/10 rounded-lg p-3 text-sm text-[#0F1E38] focus:outline-none focus:border-[#1170CD] disabled:opacity-60"
            placeholder="Paste the full job posting here..."
          />

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

          <button
            type="button"
            onClick={handleTailor}
            disabled={busy}
            className="mt-4 bg-[#1170CD] hover:bg-[#0F5FB3] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? "Checking fit & tailoring..." : saving ? "Saving..." : "Tailor My Resume"}
          </button>
        </div>

        <AnimatePresence>
          {busy && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="mt-4 flex items-center gap-3 bg-white rounded-xl border-2 border-[#1B2A4A]/8 px-4 py-3"
            >
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-[#1170CD]"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              />
              <p className="text-sm text-[#425066]">
                {loading ? "Checking fit against your profile..." : "Saving your tailored resume..."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}