import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"
import { createClient } from "@/utils/supabase/server"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

interface TailorRequestBody {
  jobDescription: string
}

type MatchLevel = "Strong Match" | "Partial Match" | "Limited Match"

interface JobInput {
  title?: string
  company?: string
  location?: string
  period?: string
  description?: string
}

interface TailorResult {
  matchLevel: MatchLevel
  matchNote: string
  experience: { bullets: string[] }[]
  introMessage: string
}

function buildTailoringPrompt(
  profile: Record<string, unknown>,
  jobs: JobInput[],
  jobDescription: string,
) {
  const jobsBlock = jobs.length
    ? jobs
        .map(
          (j, i) => `
Job ${i + 1}:
Title: ${j.title || "Not provided"}
Company: ${j.company || "Not provided"}
Location: ${j.location || "Not provided"}
Dates: ${j.period || "Not provided"}
Description (from applicant, in their own words): ${j.description || "Not provided"}`,
        )
        .join("\n")
    : "No work experience provided."

  const baseInstructions = `
You are a resume-tailoring assistant.

Your job is to (1) honestly assess how well a candidate's profile matches
a job description, and (2) tailor resume bullet points for EACH of the
candidate's jobs accordingly — without ever inventing facts, and without
using stronger or more specialized language than the profile actually
supports.

==================================================
CRITICAL TRUTHFULNESS RULES
==================================================

1. The applicant profile is the ONLY source of truth about the candidate.

2. The job description describes what the EMPLOYER wants.
   It is NOT evidence that the applicant has those skills, qualifications,
   tools, certifications, experience, availability, or employment conditions.

3. NEVER invent, assume, infer, exaggerate, or upgrade candidate facts.

4. You may rephrase, shorten, combine, or emphasize information that is
   explicitly present in that SPECIFIC job's own description field.

5. You MUST NOT add a tool, software, platform, system, technology,
   methodology, certification, industry, or qualification unless it is
   explicitly supported by that job's own description.

6. You MUST NOT claim that an employer was a BPO, call center, healthcare
   company, financial company, IT company, etc. unless that job's own
   description explicitly establishes that industry.

7. Target role preferences are NOT evidence of previous experience.

8. NEVER claim shift, onsite, or remote-work availability unless the
   applicant profile explicitly states it.

9. NEVER claim work authorization, visa status, or "no sponsorship
   required" unless that information is explicitly present in the
   applicant profile.

10. NEVER invent salary expectations, metrics, percentages, achievements,
    KPIs, awards, performance results, or numbers.

11. NEVER convert a job requirement into a candidate qualification.

12. Tailoring means emphasizing relevant existing experience.
    Tailoring does NOT mean creating new experience.

==================================================
DON'T FORCE A MATCH — WORDING DISCIPLINE
==================================================

Using STRONGER, MORE SENIOR, or MORE SPECIALIZED language than a job's
own description actually supports is ALSO a truthfulness violation, even
when every individual word is technically about something the candidate
really did.

If the candidate's skills, experience, or target role do not
substantially match the job requirements, clearly reflect that mismatch
in tone instead of trying to make the candidate appear qualified. Never
reach for job-posting vocabulary just because it sounds more impressive
than the candidate's own words.

==================================================
SKILLS ARE NOT DUTIES — DON'T INVENT DETAIL
==================================================

A line in the Skills list is a competency claim, not a description of
specific day-to-day duties. If a job's own description does not elaborate
on HOW a skill was used, you MUST NOT invent that detail — even if the
target job description happens to describe exactly that kind of detail.

==================================================
DON'T MERGE FACTS ACROSS DIFFERENT JOBS
==================================================

Each job's bullets must be built ONLY from that job's own description
field above. Never borrow a tool, method, or detail stated under a
DIFFERENT job and attach it to this one, even if both facts are
individually true of the candidate.

==================================================
MATCH LEVEL CLASSIFICATION
==================================================

Before writing anything else, classify the overall fit between the
applicant profile and the job description into exactly one of:

- "Strong Match": most of the job's core requirements are directly
  supported by the applicant's actual skills and work history.
- "Partial Match": there is real, genuine overlap but also clear gaps
  in core requirements.
- "Limited Match": the job's core requirements are not established
  anywhere in the applicant profile. Any overlap is incidental or very
  general (e.g. "communication," "teamwork").

A large mismatch in target role type is strong evidence toward "Limited
Match," even if a few soft skills overlap.

Write a one-to-two sentence "matchNote" explaining the classification in
plain language the candidate can act on.

==================================================
JOB DESCRIPTION (TARGET)
==================================================

${jobDescription}

==================================================
APPLICANT PROFILE
==================================================

Skills:
${profile.skills_summary ?? "Not provided"}

Target Market:
${profile.target_market ?? "Not provided"}

Target Role Type:
${profile.target_role_type ?? "Not provided"}

Work Setup:
${profile.work_setup_preference ?? "Not provided"}

Timezone Overlap:
${profile.timezone_overlap ?? "Not provided"}

Expected Salary:
${profile.expected_salary ?? "Not provided"}

Work Experience (tailor bullets for EACH job below, in this exact order):
${jobsBlock}

==================================================
TARGET MARKET
==================================================

If Target Market is "Local PH": use natural Philippine professional
resume language. If an expected salary is explicitly provided, it may be
expressed in PHP. Do not invent salary expectations or onsite availability.

If Target Market is "Global Remote": use concise international
professional language. Do not include age, civil status, religion, or
photo references. Mention timezone or remote availability ONLY if
explicitly provided in the profile — never state a stated PREFERENCE as
if it were stated EXPERIENCE.

==================================================
BPO / CALL CENTER TARGETING
==================================================

If Target Role Type is "BPO", that does NOT mean the applicant has BPO
experience. Only emphasize what each job's own description actually
supports.

==================================================
OUTPUT REQUIREMENTS
==================================================

Produce, in this order:

1. matchLevel — exactly one of "Strong Match", "Partial Match", "Limited Match".
2. matchNote — 1-2 plain-language sentences explaining the classification.
3. experience — an array with EXACTLY ${jobs.length} item(s), one per job
   listed above, IN THE SAME ORDER. Each item has a "bullets" array of
   2-4 ATS-friendly, TRUTHFUL bullet points built only from that job's
   own description field. Do not include the job title, company, or
   dates in the bullets themselves — only the duty/achievement text.
4. introMessage — 2-4 sentences. For a Strong or Partial Match, this can
   express genuine interest in the role. For a Limited Match, this must
   NOT imply the candidate is positioned to perform the job's core
   function.

==================================================
FINAL CHECK BEFORE RESPONDING
==================================================

Before producing the JSON, internally verify every factual statement
AND every word choice: "Can this exact claim, and this exact level of
seniority/specialization in wording, be directly supported by that
SPECIFIC job's own description?" If NO: remove or rewrite it in plainer,
more literal language. If YES: it may be included.

Do not explain this process in the output. Return ONLY the requested JSON.
`.trim()

  return baseInstructions
}

async function callGroq(prompt: string, jobCount: number): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",

    messages: [
      {
        role: "system",
        content:
          "You are an expert resume writer and honest career coach. " +
          "You must never invent or assume candidate facts, and you must " +
          "never use stronger or more specialized wording than the " +
          "candidate's profile actually supports. Return only the " +
          "requested structured JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],

    response_format: {
      type: "json_schema",
      json_schema: {
        name: "tailor_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            matchLevel: {
              type: "string",
              enum: ["Strong Match", "Partial Match", "Limited Match"],
            },
            matchNote: {
              type: "string",
            },
            experience: {
              type: "array",
              minItems: jobCount,
              maxItems: jobCount,
              items: {
                type: "object",
                properties: {
                  bullets: {
                    type: "array",
                    minItems: 2,
                    maxItems: 4,
                    items: { type: "string" },
                  },
                },
                required: ["bullets"],
                additionalProperties: false,
              },
            },
            introMessage: {
              type: "string",
            },
          },
          required: ["matchLevel", "matchNote", "experience", "introMessage"],
          additionalProperties: false,
        },
      },
    },

    temperature: 0.4,
    max_tokens: 1536,
  })

  return completion.choices[0]?.message?.content ?? ""
}

const VALID_MATCH_LEVELS: MatchLevel[] = ["Strong Match", "Partial Match", "Limited Match"]

function parseTailorResult(raw: string, jobCount: number): TailorResult | null {
  try {
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()

    const parsed = JSON.parse(cleaned)

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !VALID_MATCH_LEVELS.includes(parsed.matchLevel) ||
      typeof parsed.matchNote !== "string" ||
      !Array.isArray(parsed.experience) ||
      parsed.experience.length !== jobCount ||
      typeof parsed.introMessage !== "string"
    ) {
      return null
    }

    const experience = parsed.experience.map((job: unknown) => {
      if (!job || typeof job !== "object" || !Array.isArray((job as { bullets?: unknown }).bullets)) {
        return null
      }
      const bullets = (job as { bullets: unknown[] }).bullets.filter(
        (b): b is string => typeof b === "string" && b.trim().length > 0,
      )
      return bullets.length > 0 ? { bullets } : null
    })

    if (experience.some((e: unknown) => e === null)) return null

    return {
      matchLevel: parsed.matchLevel,
      matchNote: parsed.matchNote.trim(),
      experience,
      introMessage: parsed.introMessage.trim(),
    }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TailorRequestBody = await request.json()
    const { jobDescription } = body

    if (typeof jobDescription !== "string" || !jobDescription.trim()) {
      return NextResponse.json({ error: "Job description is required." }, { status: 400 })
    }

    const trimmedJobDescription = jobDescription.trim()

    if (trimmedJobDescription.length > 30000) {
      return NextResponse.json(
        { error: "Job description is too long. Please provide a shorter job posting." },
        { status: 400 },
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (profileError) {
      console.error("Profile lookup error:", profileError)
      return NextResponse.json({ error: "Unable to load your profile." }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Complete your profile in Onboarding before tailoring a resume." },
        { status: 400 },
      )
    }

    const jobs: JobInput[] = Array.isArray(profile.work_experience) ? profile.work_experience : []

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: "Add at least one job in Onboarding before tailoring a resume." },
        { status: 400 },
      )
    }

    const prompt = buildTailoringPrompt(profile as Record<string, unknown>, jobs, trimmedJobDescription)

    let rawResponse = await callGroq(prompt, jobs.length)
    let result = parseTailorResult(rawResponse, jobs.length)

    if (!result) {
      console.warn("First tailor attempt unparseable, retrying once.")
      rawResponse = await callGroq(prompt, jobs.length)
      result = parseTailorResult(rawResponse, jobs.length)
    }

    if (!result) {
      console.error("Unable to parse Groq response after retry:", rawResponse)
      return NextResponse.json(
        { error: "The AI response couldn't be parsed. Please try again." },
        { status: 502 },
      )
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error("Tailor API error:", err)
    return NextResponse.json({ error: "Something went wrong while tailoring." }, { status: 500 })
  }
}