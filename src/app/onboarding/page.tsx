"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/utils/supabase/client"

// Place this file at: src/app/onboarding/page.tsx

type FormState = {
  full_name: string
  phone: string
  expected_salary: string
  notice_period: string
  skills_summary: string
  work_history: string
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
  work_history: "",
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

// Validates only the fields relevant to the given step. Called before
// advancing to the next step and before final submit — never blocks
// fields that have a sensible default (notice period, the status
// dropdowns) since those can never actually be "empty."
function validateStep(step: number, form: FormState): Errors {
  const errors: Errors = {}

  if (step === 0) {
    if (!form.full_name.trim()) errors.full_name = "Enter your full name."
    if (!form.phone.trim()) errors.phone = "Enter a contact number."
    if (!form.expected_salary.trim()) errors.expected_salary = "Enter your expected salary."
  }

  if (step === 1) {
    if (!form.skills_summary.trim()) errors.skills_summary = "List at least a few skills."
    if (!form.work_history.trim()) errors.work_history = "Add at least one role, even briefly."
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
        setForm({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          expected_salary: data.expected_salary ?? "",
          notice_period: data.notice_period ?? "30 Days Rendering",
          skills_summary: data.skills_summary ?? "",
          work_history: data.work_history ?? "",
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

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

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

    const payload = { ...form, user_id: user.id, email: user.email }

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
                    Kursoha's AI uses this to tailor bullet points to each job.
                  </p>

                  <Field label="Skills Summary" required error={errors.skills_summary}>
                    <textarea
                      value={form.skills_summary}
                      onChange={(e) => update("skills_summary", e.target.value)}
                      className={`input min-h-[100px] ${errors.skills_summary ? "input-error" : ""}`}
                      placeholder="React, TypeScript, Node.js, REST APIs, Git..."
                    />
                  </Field>
                  <Field label="Work History" required error={errors.work_history}>
                    <textarea
                      value={form.work_history}
                      onChange={(e) => update("work_history", e.target.value)}
                      className={`input min-h-[140px] ${errors.work_history ? "input-error" : ""}`}
                      placeholder="Job title, company, dates, and a couple lines about what you did..."
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

// Segmented pill-button group — used for every status/preference field.
// None of these have more than 4 options, so a row of visible buttons is
// faster to scan and click than opening a native <select> dropdown for
// each one, and it matches the same visual language as the target-market
// toggle above it.
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