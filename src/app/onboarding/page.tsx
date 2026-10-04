"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/utils/supabase/client"

// Place this file at: src/app/onboarding/page.tsx

export interface JobEntryForm {
  title: string
  company: string
  location: string
  period: string
  description: string
}

const emptyJobEntry = (): JobEntryForm => ({
  title: "",
  company: "",
  location: "",
  period: "",
  description: "",
})

interface EducEntryForm {
  degree: string
  school: string
  location: string
  year: string
}

const emptyEducEntry = (): EducEntryForm => ({ degree: "", school: "", location: "", year: "" })

type FormState = {
  full_name: string
  phone: string
  expected_salary: string
  notice_period: string
  skills_summary: string
  work_experience: JobEntryForm[]
  education: EducEntryForm[]
  certifications: string
  target_market: "Local PH" | "Global Remote"
  timezone_overlap: string
  sss_status: string
  tin_status: string
  philhealth_status: string
  nbi_clearance_status: string
  work_setup_preference: string
  target_role_type: string
}

const initialState: FormState = {
  full_name: "",
  phone: "",
  expected_salary: "",
  notice_period: "30 Days Rendering",
  skills_summary: "",
  work_experience: [emptyJobEntry()],
  education: [],
  certifications: "",
  target_market: "Local PH",
  timezone_overlap: "",
  sss_status: "Not Provided",
  tin_status: "Not Provided",
  philhealth_status: "Not Provided",
  nbi_clearance_status: "None",
  work_setup_preference: "Onsite",
  target_role_type: "General",
}

const STEPS = ["Personal Info", "Skills & Experience", "Target Market"]

type Errors = Partial<Record<keyof FormState, string>>

function validateStep(step: number, form: FormState): Errors {
  const errors: Errors = {}

  if (step === 0) {
    if (!form.full_name.trim()) errors.full_name = "Enter your full name."
    if (!form.phone.trim()) errors.phone = "Enter a contact number."
    if (!form.expected_salary.trim()) errors.expected_salary = "Enter your expected salary."
  }

  if (step === 1) {
    if (!form.skills_summary.trim()) errors.skills_summary = "List at least a few skills."
    const firstJob = form.work_experience[0]
    if (!firstJob || !firstJob.title.trim() || !firstJob.company.trim() || !firstJob.description.trim()) {
      errors.work_experience = "Add at least one job with a title, company, and what you did."
    }
  }

  if (step === 2) {
    if (form.target_market === "Global Remote" && !form.timezone_overlap.trim()) {
      errors.timezone_overlap = "Add your timezone overlap for remote employers."
    }
  }

  return errors
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<Errors>({})
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      if (fetchError) {
        console.error(fetchError)
      } else if (data) {
        setProfileId(data.id)

        // Migration path: profiles saved before structured experience existed
        // only have the old free-text `work_history` column. Carry that
        // forward as a single job entry so returning users don't lose what
        // they already wrote — they can split it into real entries from here.
        const structuredJobs: JobEntryForm[] =
          Array.isArray(data.work_experience) && data.work_experience.length > 0
            ? data.work_experience
            : data.work_history?.trim()
              ? [{ title: "", company: "", location: "", period: "", description: data.work_history }]
              : [emptyJobEntry()]

        setForm({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          expected_salary: data.expected_salary ?? "",
          notice_period: data.notice_period ?? "30 Days Rendering",
          skills_summary: data.skills_summary ?? "",
          work_experience: structuredJobs,
          education: Array.isArray(data.education) ? data.education : [],
          certifications: Array.isArray(data.certifications) ? data.certifications.join("\n") : "",
          target_market: data.target_market ?? "Local PH",
          timezone_overlap: data.timezone_overlap ?? "",
          sss_status: data.sss_status ?? "Not Provided",
          tin_status: data.tin_status ?? "Not Provided",
          philhealth_status: data.philhealth_status ?? "Not Provided",
          nbi_clearance_status: data.nbi_clearance_status ?? "None",
          work_setup_preference: data.work_setup_preference ?? "Onsite",
          target_role_type: data.target_role_type ?? "General",
        })
      }
      setLoading(false)
    }

    loadProfile()
  }, [router, supabase])

  const update = (field: keyof FormState, value: FormState[keyof FormState]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const updateJob = (index: number, field: keyof JobEntryForm, value: string) => {
    const next = [...form.work_experience]
    next[index] = { ...next[index], [field]: value }
    update("work_experience", next)
  }

  const addJob = () => update("work_experience", [...form.work_experience, emptyJobEntry()])
  const removeJob = (index: number) =>
    update("work_experience", form.work_experience.filter((_, i) => i !== index))

  const updateEduc = (index: number, field: keyof EducEntryForm, value: string) => {
    const next = [...form.education]
    next[index] = { ...next[index], [field]: value }
    update("education", next)
  }
  const addEduc = () => update("education", [...form.education, emptyEducEntry()])
  const removeEduc = (index: number) => update("education", form.education.filter((_, i) => i !== index))

  const goNext = () => {
    const stepErrors = validateStep(step, form)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const goBack = () => {
    setErrors({})
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleSubmit = async () => {
    const stepErrors = validateStep(step, form)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }

    setSaving(true)
    setSubmitError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }

    const cleanedJobs = form.work_experience.filter(
      (j) => j.title.trim() || j.company.trim() || j.description.trim()
    )
    const cleanedEducation = form.education.filter(
      (e) => e.degree.trim() || e.school.trim()
    )
    const cleanedCertifications = form.certifications
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean)

    const payload = {
      ...form,
      work_experience: cleanedJobs,
      education: cleanedEducation,
      certifications: cleanedCertifications,
      user_id: user.id,
      email: user.email,
    }

    const { error: saveError } = profileId
      ? await supabase.from("profiles").update(payload).eq("id", profileId)
      : await supabase.from("profiles").insert(payload)

    setSaving(false)

    if (saveError) {
      setSubmitError(saveError.message)
      return
    }

    router.push("/dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFF2F9] flex items-center justify-center">
        <span className="text-[#425066] text-sm">Loading...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#EFF2F9] flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={`text-xs font-semibold ${
                  i <= step ? "text-[#1170CD]" : "text-[#1B2A4A]/30"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="h-1.5 bg-[#1B2A4A]/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#1170CD] rounded-full"
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-[#1B2A4A]/8 shadow-sm p-7 sm:p-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-[#0F1E38] mb-1">Personal Info</h2>
                  <p className="text-sm text-[#425066] mb-5">
                    This appears on every resume you generate.
                  </p>

                  <Field label="Full Name" required error={errors.full_name}>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(e) => update("full_name", e.target.value)}
                      className={`input ${errors.full_name ? "input-error" : ""}`}
                      placeholder="Juan Dela Cruz"
                    />
                  </Field>
                  <Field label="Phone" required error={errors.phone}>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className={`input ${errors.phone ? "input-error" : ""}`}
                      placeholder="+63 917 123 4567"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Expected Salary" required error={errors.expected_salary}>
                      <input
                        type="text"
                        value={form.expected_salary}
                        onChange={(e) => update("expected_salary", e.target.value)}
                        className={`input ${errors.expected_salary ? "input-error" : ""}`}
                        placeholder="₱35,000 / month"
                      />
                    </Field>
                    <Field label="Notice Period">
                      <input
                        type="text"
                        value={form.notice_period}
                        onChange={(e) => update("notice_period", e.target.value)}
                        className="input"
                      />
                    </Field>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-[#0F1E38] mb-1">Skills & Experience</h2>
                  <p className="text-sm text-[#425066] mb-5">
                    Kursoha AI tailors bullet points per job, using only what you write below.
                  </p>

                  <Field label="Skills Summary" required error={errors.skills_summary}>
                    <textarea
                      value={form.skills_summary}
                      onChange={(e) => update("skills_summary", e.target.value)}
                      className={`input min-h-[100px] ${errors.skills_summary ? "input-error" : ""}`}
                      placeholder="React, TypeScript, Node.js, REST APIs, Git..."
                    />
                  </Field>

                  <div>
                    <label className="block text-sm font-medium text-[#0F1E38] mb-1.5">
                      Work Experience <span className="text-[#1170CD]">*</span>
                    </label>
                    <div className="space-y-4">
                      {form.work_experience.map((job, i) => (
                        <div key={i} className="border-2 border-[#1B2A4A]/10 rounded-lg p-4 relative">
                          {form.work_experience.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeJob(i)}
                              className="absolute top-3 right-3 text-xs text-red-500 hover:underline"
                            >
                              Remove
                            </button>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-[#425066] mb-1">Job Title</label>
                              <input
                                type="text"
                                value={job.title}
                                onChange={(e) => updateJob(i, "title", e.target.value)}
                                className="input"
                                placeholder="Customer Service Representative"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#425066] mb-1">Company</label>
                              <input
                                type="text"
                                value={job.company}
                                onChange={(e) => updateJob(i, "company", e.target.value)}
                                className="input"
                                placeholder="ABC Solutions"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#425066] mb-1">Location</label>
                              <input
                                type="text"
                                value={job.location}
                                onChange={(e) => updateJob(i, "location", e.target.value)}
                                className="input"
                                placeholder="Cebu City, Philippines"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#425066] mb-1">Dates</label>
                              <input
                                type="text"
                                value={job.period}
                                onChange={(e) => updateJob(i, "period", e.target.value)}
                                className="input"
                                placeholder="Jan 2024 – Present"
                              />
                            </div>
                          </div>
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-[#425066] mb-1">
                              What did you do here?
                            </label>
                            <textarea
                              value={job.description}
                              onChange={(e) => updateJob(i, "description", e.target.value)}
                              rows={4}
                              className="input"
                              placeholder={"Assisted customers via phone, email, and chat\nResolved issues and documented interactions"}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.work_experience && (
                      <p className="text-xs text-red-500 mt-1">{errors.work_experience}</p>
                    )}
                    <button
                      type="button"
                      onClick={addJob}
                      className="mt-3 text-sm font-medium text-[#1170CD] hover:underline"
                    >
                      + Add another job
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F1E38] mb-1.5">
                      Education <span className="text-[#425066] font-normal">(optional)</span>
                    </label>
                    <div className="space-y-3">
                      {form.education.map((ed, i) => (
                        <div key={i} className="border-2 border-[#1B2A4A]/10 rounded-lg p-4 relative">
                          <button
                            type="button"
                            onClick={() => removeEduc(i)}
                            className="absolute top-3 right-3 text-xs text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-[#425066] mb-1">Degree</label>
                              <input
                                type="text"
                                value={ed.degree}
                                onChange={(e) => updateEduc(i, "degree", e.target.value)}
                                className="input"
                                placeholder="Bachelor of Science in Information Technology"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#425066] mb-1">School</label>
                              <input
                                type="text"
                                value={ed.school}
                                onChange={(e) => updateEduc(i, "school", e.target.value)}
                                className="input"
                                placeholder="University of San Carlos"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#425066] mb-1">Location</label>
                              <input
                                type="text"
                                value={ed.location}
                                onChange={(e) => updateEduc(i, "location", e.target.value)}
                                className="input"
                                placeholder="Cebu City, Philippines"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#425066] mb-1">Year</label>
                              <input
                                type="text"
                                value={ed.year}
                                onChange={(e) => updateEduc(i, "year", e.target.value)}
                                className="input"
                                placeholder="Graduated 2022"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addEduc}
                      className="mt-3 text-sm font-medium text-[#1170CD] hover:underline"
                    >
                      + Add education
                    </button>
                  </div>

                  <Field label="Certifications (optional, one per line)">
                    <textarea
                      value={form.certifications}
                      onChange={(e) => update("certifications", e.target.value)}
                      className="input min-h-[90px]"
                      placeholder={"Google Analytics Certified\nHubSpot Inbound Marketing Certification"}
                    />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold text-[#0F1E38] mb-1">Target Market</h2>
                  <p className="text-sm text-[#425066] mb-5">
                    This changes how your resume is tailored — local conventions vs. international.
                  </p>

                  <div className="flex gap-3 mb-5">
                    {(["Local PH", "Global Remote"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => update("target_market", option)}
                        className={`flex-1 py-3 rounded-lg border-2 text-sm font-semibold transition-colors ${
                          form.target_market === option
                            ? "border-[#1170CD] bg-[#1170CD]/10 text-[#1170CD]"
                            : "border-[#1B2A4A]/12 text-[#425066]"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  {form.target_market === "Global Remote" ? (
                    <Field label="Timezone Overlap" required error={errors.timezone_overlap}>
                      <input
                        type="text"
                        value={form.timezone_overlap}
                        onChange={(e) => update("timezone_overlap", e.target.value)}
                        className={`input ${errors.timezone_overlap ? "input-error" : ""}`}
                        placeholder="GMT+8, 4hrs overlap with EST"
                      />
                    </Field>
                  ) : (
                    <div className="space-y-4">
                      <Field label="SSS Status">
                        <OptionGroup
                          value={form.sss_status}
                          onChange={(v) => update("sss_status", v)}
                          options={["Not Provided", "Active", "Pending"]}
                        />
                      </Field>
                      <Field label="TIN Status">
                        <OptionGroup
                          value={form.tin_status}
                          onChange={(v) => update("tin_status", v)}
                          options={["Not Provided", "Active", "Pending"]}
                        />
                      </Field>
                      <Field label="PhilHealth Status">
                        <OptionGroup
                          value={form.philhealth_status}
                          onChange={(v) => update("philhealth_status", v)}
                          options={["Not Provided", "Active", "Pending"]}
                        />
                      </Field>
                      <Field label="NBI Clearance">
                        <OptionGroup
                          value={form.nbi_clearance_status}
                          onChange={(v) => update("nbi_clearance_status", v)}
                          options={["None", "Valid", "Processing"]}
                        />
                      </Field>
                    </div>
                  )}

                  <Field label="Work Setup Preference">
                    <OptionGroup
                      value={form.work_setup_preference}
                      onChange={(v) => update("work_setup_preference", v)}
                      options={["Onsite", "Hybrid", "WFH"]}
                    />
                  </Field>

                  <Field label="Target Role Type">
                    <OptionGroup
                      value={form.target_role_type}
                      onChange={(v) => update("target_role_type", v)}
                      options={["General", "BPO", "Developer", "VA"]}
                    />
                  </Field>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {submitError && <p className="text-sm text-red-500 mt-4">{submitError}</p>}

          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="px-5 py-2.5 rounded-lg font-semibold text-sm text-[#425066] disabled:opacity-0"
            >
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="bg-[#1170CD] hover:bg-[#0F5FB3] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="bg-[#1170CD] hover:bg-[#0F5FB3] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? "Saving..." : "Finish Setup"}
              </button>
            )}
          </div>
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

function Field({
  label,
  children,
  required,
  error,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
  error?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#0F1E38] mb-1.5">
        {label}
        {required && <span className="text-[#1170CD]"> *</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function OptionGroup({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3.5 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
            value === opt
              ? "border-[#1170CD] bg-[#1170CD]/10 text-[#1170CD]"
              : "border-[#1B2A4A]/12 text-[#425066] hover:border-[#1B2A4A]/25"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}