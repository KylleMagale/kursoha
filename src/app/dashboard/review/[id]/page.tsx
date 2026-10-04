import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ResumeReview } from '@/components/dashboard/resume-review'
import type { ResumeData } from '@/components/resume/template1'

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: resumeVersion } = await supabase
    .from('resume_versions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!resumeVersion) notFound()

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('full_name, phone, skills_summary, education, certifications')
    .eq('user_id', user.id)
    .maybeSingle()

  const profile: ResumeData = {
    fullName: profileRow?.full_name ?? '',
    email: user.email ?? '',
    phone: profileRow?.phone ?? '',
    skills: profileRow?.skills_summary ?? '',
    education: Array.isArray(profileRow?.education) ? profileRow.education : [],
    certifications: Array.isArray(profileRow?.certifications) ? profileRow.certifications : [],
  }

  return <ResumeReview profile={profile} resumeVersion={resumeVersion} />
}