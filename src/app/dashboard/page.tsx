import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FilePlus2, Sparkles } from 'lucide-react'
import { SignOutButton } from '@/components/dashboard/sign-out-button'
import { FadeIn } from '@/components/dashboard/fade-in'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, target_market, target_role_type, skills_summary')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) redirect('/onboarding')

  const firstName = profile.full_name?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-[#EFF2F9] px-4 sm:px-6 py-8 sm:py-12">
      <FadeIn>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-[#0F1E38]">Welcome back, {firstName}</h1>
              <p className="text-sm text-[#425066] mt-1">
                {profile.target_market === 'Global Remote'
                  ? 'Targeting Global Remote roles'
                  : 'Targeting Local PH roles'}
                {profile.target_role_type ? ` · ${profile.target_role_type}` : ''}
              </p>
            </div>
            <SignOutButton />
          </div>

          {/* Primary action */}
          <Link
            href="/dashboard/create"
            className="group block bg-white rounded-2xl border-2 border-[#1B2A4A]/8 shadow-sm p-6 hover:border-[#1170CD]/30 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-[#1170CD]/10 flex items-center justify-center group-hover:bg-[#1170CD]/15 transition-colors">
                <FilePlus2 className="w-5 h-5 text-[#1170CD]" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-[#0F1E38]">Tailor a resume</h2>
                <p className="text-sm text-[#425066] mt-0.5">
                  Paste a job description and get an honest fit assessment plus tailored bullet points.
                </p>
              </div>
            </div>
          </Link>

          {/* Profile summary */}
          <div className="mt-5 bg-white rounded-2xl border-2 border-[#1B2A4A]/8 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <h2 className="text-sm font-semibold text-[#0F1E38]">Your profile</h2>
              <Link href="/onboarding" className="text-xs font-medium text-[#1170CD] hover:underline">
                Edit
              </Link>
            </div>
            <p className="text-sm text-[#425066] mt-2 leading-relaxed">
              {profile.skills_summary
                ? profile.skills_summary.slice(0, 160) + (profile.skills_summary.length > 160 ? '…' : '')
                : 'No skills summary yet.'}
            </p>
          </div>

          {/* Quiet nudge, not a dead end */}
          <div className="mt-5 flex items-start gap-2 bg-[#1B2A4A]/[0.04] rounded-lg px-3.5 py-3">
            <Sparkles className="w-4 h-4 text-[#6B7A90] shrink-0 mt-0.5" />
            <p className="text-xs text-[#6B7A90] leading-relaxed">
              Application history and saved resume versions are coming soon — for now, each tailor
              result lives on the Create page until you download it.
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}