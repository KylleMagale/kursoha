"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle2, AlertTriangle, XCircle, Download, ArrowLeft, Sparkles, Loader2, Pencil, Check } from "lucide-react"
import { pdf } from "@react-pdf/renderer"
import { createClient } from "@/utils/supabase/client"
import Template1, { type ResumeData, type ExperienceEntry } from "@/components/resume/template1"
import Template1PDF from "@/components/resume/template1-pdf"
import ResumePreview from "@/components/resume/resume-preview"

type MatchLevel = "Strong Match" | "Partial Match" | "Limited Match"

interface ResumeVersionRow {
  id: string
  match_level: MatchLevel
  match_note: string | null
  tailored_experience: ExperienceEntry[]
  intro_message: string | null
}

const MATCH_STYLES: Record<
  MatchLevel,
  { bg: string; accent: string; text: string; iconBg: string; Icon: typeof CheckCircle2 }
> = {
  "Strong Match": { bg: "bg-emerald-50", accent: "bg-emerald-500", text: "text-emerald-800", iconBg: "bg-emerald-500", Icon: CheckCircle2 },
  "Partial Match": { bg: "bg-amber-50", accent: "bg-amber-500", text: "text-amber-800", iconBg: "bg-amber-500", Icon: AlertTriangle },
  "Limited Match": { bg: "bg-red-50", accent: "bg-red-500", text: "text-red-800", iconBg: "bg-red-500", Icon: XCircle },
}

export function ResumeReview({
  profile,
  resumeVersion,
}: {
  profile: ResumeData
  resumeVersion: ResumeVersionRow
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [experience, setExperience] = useState<ExperienceEntry[]>(resumeVersion.tailored_experience)
  const [introMessage, setIntroMessage] = useState(resumeVersion.intro_message ?? "")

  const matchStyle = MATCH_STYLES[resumeVersion.match_level]
  const resumeData: ResumeData = { ...profile, experience }

  const updateBullets = (jobIndex: number, raw: string) => {
    const next = [...experience]
    next[jobIndex] = { ...next[jobIndex], bullets: raw.split("\n") }
    setExperience(next)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from("resume_versions")
      .update({
        tailored_experience: experience,
        intro_message: introMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resumeVersion.id)
    setSaving(false)
    setEditing(false)
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const blob = await pdf(<Template1PDF data={resumeData} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const safeName = (profile.fullName || "resume").trim().replace(/\s+/g, "_")
      a.href = url
      a.download = `${safeName}_Kursoha_Resume.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-[#EFF2F9] px-4 sm:px-6 py-8 sm:py-12"
    >
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard/create"
          className="inline-flex items-center gap-1.5 text-sm text-[#425066] hover:text-[#0F1E38] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Tailor another
        </Link>

        <div className={`relative overflow-hidden rounded-2xl ${matchStyle.bg} pl-5 pr-5 py-5 mb-4`}>
          <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${matchStyle.accent}`} />
          <div className="flex items-start gap-3">
            <div className={`shrink-0 w-9 h-9 rounded-full ${matchStyle.iconBg} flex items-center justify-center`}>
              <matchStyle.Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className={`inline-block text-xs font-bold uppercase tracking-wide ${matchStyle.text} mb-1`}>
                {resumeVersion.match_level}
              </span>
              <p className={`text-sm ${matchStyle.text} opacity-90 leading-relaxed`}>
                {resumeVersion.match_note}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-[#1B2A4A]/8 shadow-sm p-6 mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-[#0F1E38]">Cover Message</h2>
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1170CD] hover:underline"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit content
              </button>
            )}
          </div>

          {editing ? (
            <textarea
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value)}
              rows={4}
              className="w-full border-2 border-[#1B2A4A]/10 rounded-lg p-3 text-sm text-[#0F1E38] focus:outline-none focus:border-[#1170CD]"
            />
          ) : (
            <p className="text-sm text-[#425066] leading-relaxed mb-4">{introMessage}</p>
          )}

          <div className="flex items-start gap-2 bg-[#1B2A4A]/[0.04] rounded-lg px-3.5 py-3 mt-4">
            <Sparkles className="w-4 h-4 text-[#6B7A90] shrink-0 mt-0.5" />
            <p className="text-xs text-[#6B7A90] leading-relaxed">
              AI-generated content. Review for accuracy, tone, and truthfulness before using it in
              an actual application.
            </p>
          </div>
        </div>

        {editing && (
          <div className="bg-white rounded-2xl border-2 border-[#1B2A4A]/8 shadow-sm p-6 mb-5 space-y-4">
            <h2 className="text-lg font-semibold text-[#0F1E38]">Edit Bullet Points</h2>
            {experience.map((job, i) => (
              <div key={i}>
                <p className="text-xs font-semibold text-[#425066] mb-1.5">
                  {job.title} — {job.company}
                </p>
                <textarea
                  value={job.bullets.join("\n")}
                  onChange={(e) => updateBullets(i, e.target.value)}
                  rows={Math.max(3, job.bullets.length)}
                  className="w-full border-2 border-[#1B2A4A]/10 rounded-lg p-3 text-sm text-[#0F1E38] focus:outline-none focus:border-[#1170CD]"
                  placeholder="One bullet per line"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#1170CD] hover:bg-[#0F5FB3] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-semibold text-[#0F1E38]">Review your resume</h2>
            <p className="text-sm text-[#425066]">This updates live as you edit above.</p>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="shrink-0 inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#1170CD] hover:bg-[#0F5FB3] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? "Generating PDF..." : "Download PDF"}
          </button>
        </div>

        <div className="rounded-xl bg-[#1B2A4A]/[0.06] p-2 sm:p-4">
          <ResumePreview>
            <Template1 data={resumeData} />
          </ResumePreview>
        </div>
      </div>
    </motion.div>
  )
}