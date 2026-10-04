// src/components/resume/template1.tsx

export interface ExperienceEntry {
  title: string
  company: string
  location?: string
  period?: string
  bullets: string[]
}

export interface EducationEntry {
  degree: string
  school: string
  location?: string
  year?: string
}

export interface ResumeData {
  fullName: string
  email?: string
  phone?: string
  location?: string
  links?: string[]
  headline?: string
  tagline?: string
  summary?: string
  skills?: string
  experience?: ExperienceEntry[]
  workHistory?: string
  highlights?: string[]
  education?: EducationEntry[]
  certifications?: string[]
  additional?: string[]
}

const NAVY = "#1B2A4A"
const INK = "#23272F"
const MUTED = "#6B7280"
const RULE = "#CFD0DE"
const DOT = "#2F6690"

function splitSkills(raw: string): string[] {
  return raw
    .split(/[\n,;•]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2
        className="text-[14.5px] font-bold uppercase tracking-wide pb-1.5 mb-3"
        style={{ color: NAVY, borderBottom: `1.5px solid ${RULE}` }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-[14px] leading-snug" style={{ color: INK }}>
          <span aria-hidden className="mt-[1px]" style={{ color: DOT }}>
            •
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Meta({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] mt-0.5 mb-2" style={{ color: MUTED }}>
      {children}
    </p>
  )
}

function joinMeta(parts: (string | undefined)[]) {
  return parts.filter(Boolean).join("  |  ")
}

export default function Template1({ data }: { data: ResumeData }) {
  const skills = data.skills ? splitSkills(data.skills) : []
  const contactLine = [data.location, data.phone, data.email].filter(Boolean).join("  •  ")
  const linksLine = (data.links ?? []).filter(Boolean).join("  •  ")
  const hasStructuredJobs = (data.experience?.length ?? 0) > 0
  const highlights = data.highlights ?? []

  return (
    <div
      id="resume-sheet"
      className="w-[8.5in] min-h-[11in] px-[0.75in] py-[0.7in] shadow-md font-sans"
      style={{ background: "#FBFAF7", color: INK }}
    >
      <header className="text-center">
        <h1 className="text-[32px] font-extrabold uppercase leading-none tracking-tight">
          {data.fullName}
        </h1>
        {data.headline && (
          <p className="text-[17px] font-bold mt-2.5" style={{ color: NAVY }}>
            {data.headline}
          </p>
        )}
        {data.tagline && (
          <p className="text-[14px] mt-1" style={{ color: MUTED }}>
            {data.tagline}
          </p>
        )}
        <div className="mt-3.5 mb-3 mx-auto" style={{ height: 3, background: NAVY, width: "100%" }} />
        {contactLine && (
          <p className="text-[12.5px]" style={{ color: MUTED }}>
            {contactLine}
          </p>
        )}
        {linksLine && (
          <p className="text-[12.5px] mt-1" style={{ color: MUTED }}>
            {linksLine}
          </p>
        )}
      </header>

      {data.summary?.trim() && (
        <Section title="Professional Summary">
          <p className="text-[14.5px] leading-relaxed">{data.summary.trim()}</p>
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Core Competencies">
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[14.5px]">
            {skills.map((skill, i) => (
              <li key={`${skill}-${i}`} className="flex items-center gap-3">
                {i > 0 && (
                  <span aria-hidden style={{ color: MUTED }}>
                    •
                  </span>
                )}
                <span>{skill}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {hasStructuredJobs ? (
        <Section title="Professional Experience">
          <div className="space-y-4">
            {data.experience!.map((job, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[16px] font-bold leading-tight">{job.title}</h3>
                  {job.period && (
                    <span className="text-[12.5px] shrink-0" style={{ color: MUTED }}>
                      {job.period}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <p className="text-[13.5px] font-medium" style={{ color: NAVY }}>
                    {job.company}
                  </p>
                  {job.location && (
                    <span className="text-[12px] shrink-0" style={{ color: MUTED }}>
                      {job.location}
                    </span>
                  )}
                </div>
                <Bullets items={job.bullets} />
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <>
          {highlights.length > 0 && (
            <Section title="Professional Highlights">
              <Bullets items={highlights} />
            </Section>
          )}
          {data.workHistory?.trim() && (
            <Section title="Professional Experience">
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                {data.workHistory.trim()}
              </p>
            </Section>
          )}
        </>
      )}

      {(data.education?.length ?? 0) > 0 && (
        <Section title="Education">
          <div className="space-y-3">
            {data.education!.map((ed, i) => (
              <div key={i}>
                <h3 className="text-[17px] font-bold leading-tight">
                  {ed.degree}
                  {ed.school ? ` — ${ed.school}` : ""}
                </h3>
                {joinMeta([ed.location, ed.year]) && (
                  <Meta>{joinMeta([ed.location, ed.year])}</Meta>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {(data.certifications?.length ?? 0) > 0 && (
        <Section title="Certifications">
          <ul className="space-y-1">
            {data.certifications!.map((cert, i) => (
              <li key={i} className="flex gap-2.5 text-[14px]" style={{ color: INK }}>
                <span aria-hidden className="mt-[1px]" style={{ color: DOT }}>
                  •
                </span>
                <span>{cert}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(data.additional?.length ?? 0) > 0 && (
        <Section title="Additional Details">
          <p className="text-[13.5px]" style={{ color: MUTED }}>
            {data.additional!.join("     •     ")}
          </p>
        </Section>
      )}
    </div>
  )
}