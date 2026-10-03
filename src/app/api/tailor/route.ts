import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"
import { createClient } from "@/utils/supabase/server"

// Place this file at: src/app/api/tailor/route.ts
//
// Required environment variables:
// GROQ_API_KEY=gsk_...
// GROQ_MODEL=openai/gpt-oss-20b
//   (NOT 120b — it has a confirmed Groq bug where response_format:
//   json_schema is silently ignored, returning free-form text instead
//   of JSON. 20b correctly honors the schema.)
//
// Install:
// npm install groq-sdk

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

interface TailorRequestBody {
  jobDescription: string
}

type MatchLevel = "Strong Match" | "Partial Match" | "Limited Match"

interface TailorResult {
  matchLevel: MatchLevel
  matchNote: string
  bulletPoints: string[]
  introMessage: string
}

function buildTailoringPrompt(
  profile: Record<string, unknown>,
  jobDescription: string,
) {
  const baseInstructions = `
You are a resume-tailoring assistant.

Your job is to (1) honestly assess how well a candidate's profile matches
a job description, and (2) tailor resume content accordingly — without
ever inventing facts, and without using stronger language or framing to
make a weak match look closer than it actually is.

==================================================
CRITICAL TRUTHFULNESS RULES
==================================================

1. The applicant profile is the ONLY source of truth about the candidate.

2. The job description describes what the EMPLOYER wants.
   It is NOT evidence that the applicant has those skills, qualifications,
   tools, certifications, experience, availability, or employment conditions.

3. NEVER invent, assume, infer, exaggerate, or upgrade candidate facts.

4. You may rephrase, shorten, combine, or emphasize information that is
   explicitly present in the applicant profile.

5. You MUST NOT add a tool, software, platform, system, technology,
   methodology, certification, industry, or qualification unless it is
   explicitly supported by the applicant profile.

6. You MUST NOT claim that a previous employer was a BPO, call center,
   healthcare company, financial company, IT company, etc. unless the
   applicant profile explicitly establishes that industry.

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

Inventing facts is not the only way to mislead a reader. Using STRONGER,
MORE SENIOR, or MORE SPECIALIZED language than the profile actually
supports is ALSO a truthfulness violation, even when every individual
word is technically about something the candidate really did.

If the candidate's skills, experience, or target role do not
substantially match the job requirements, clearly reflect that
mismatch in tone instead of trying to make the candidate appear
qualified. Only generate resume bullets from facts supported by the
user's profile. Never infer or invent technical skills, industry
experience, achievements, tools, certifications, work arrangements, or
qualifications — and never reach for job-posting vocabulary just
because it sounds more impressive than the candidate's own words.

Examples of wording that goes too far, even without inventing a new
fact outright:

- Profile says "resolved customer concerns" ->
  Do NOT write "troubleshot complex customer issues" (stronger,
  more technical framing than the original).
- Profile says "updated customer records" ->
  Do NOT write "maintained company systems" (vaguer, sounds more
  senior/technical than what was actually described).
- Profile has no stated history of remote work, only a stated
  timezone/WFH PREFERENCE ->
  Do NOT write "experienced in a remote, cross-time-zone environment"
  (a stated preference is not a stated history).
- In a cover message, do NOT write anything implying the candidate is
  positioned to contribute to a role far outside their background
  (e.g. telling a Senior Software Engineer hiring manager the candidate
  is eager to "contribute to engineering projects" when the candidate
  has no software development experience in their profile).

When the match is weak, the safer, more honest choice is plainer
language that stays close to the candidate's actual own words — not a
more "optimized-sounding" rewrite.

==================================================
SKILLS ARE NOT DUTIES — DON'T INVENT DETAIL
==================================================

A line in the Skills list is a competency claim, not a description of
specific day-to-day duties. If Work History does not elaborate on HOW
a skill was used (which platforms, what workflow, what frequency),
you MUST NOT invent that detail — even if the job description happens
to describe exactly that kind of detail for the same general skill.

Example:
SKILLS: "Social media management" (no elaboration anywhere in Work History)
JOB: "Monitor and respond to comments and DMs across social platforms
in a timely, on-brand manner."

INCORRECT:
"Managed social media accounts, monitoring comments and messages and
ensuring timely, on-brand responses."
(This borrows the JOB POSTING's specific operational language to fill
in detail the profile never provided.)

CORRECT:
"Applied social media management skills to support brand communication
and online presence."
(Stays exactly as general as the profile's own one-line claim.)

==================================================
DON'T MERGE FACTS ACROSS DIFFERENT JOBS
==================================================

If a tool, method, or detail is stated in connection with ONE job in
Work History, do not attach it to a DIFFERENT job's tasks, even if
both facts are individually true.

Example:
WORK HISTORY:
Job A: "Updated customer records and documented interactions accurately."
Job B (different employer): "Prepared reports and spreadsheets using
Microsoft Office and Google Workspace."

INCORRECT:
"Updated customer records and documented interactions accurately using
Microsoft Office and Google Workspace tools."
(Merges a tool from Job B into a task from Job A — the profile never
states those tools were used for that task.)

CORRECT: keep each tool/method attached only to the job it was actually
stated alongside.

==================================================
MATCH LEVEL CLASSIFICATION
==================================================

Before writing anything else, classify the overall fit between the
applicant profile and the job description into exactly one of:

- "Strong Match": most of the job's core requirements are directly
  supported by the applicant's actual skills and work history.
- "Partial Match": there is real, genuine overlap (transferable skills,
  some matching responsibilities) but also clear gaps in core
  requirements.
- "Limited Match": the job's core requirements (e.g. a specific
  technical discipline, seniority level, or industry) are not
  established anywhere in the applicant profile. Any overlap is
  incidental or very general (e.g. "communication," "teamwork").

A large mismatch in target role type (e.g. profile targets VA/BPO/admin
work, job is a specialized technical or senior role) is strong evidence
toward "Limited Match," even if a few soft skills overlap.

Write a one-to-two sentence "matchNote" explaining the classification
in plain language the candidate can act on — naming the specific gap(s)
if the match is Partial or Limited.

==================================================
JOB DESCRIPTION
==================================================

${jobDescription}

==================================================
APPLICANT PROFILE
==================================================

Skills:
${profile.skills_summary ?? "Not provided"}

Work History:
${profile.work_history ?? "Not provided"}

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

==================================================
TARGET MARKET
==================================================

If Target Market is "Local PH":
- Use natural Philippine professional resume language.
- If an expected salary is explicitly provided, it may be expressed in PHP.
- Do not invent salary expectations, onsite availability, or local availability.

If Target Market is "Global Remote":
- Use concise international professional language.
- Do not include age, civil status, religion, or photo references.
- Mention timezone, remote availability, or work authorization ONLY if
  explicitly provided in the profile — and never state a stated
  PREFERENCE as if it were stated EXPERIENCE.

==================================================
BPO / CALL CENTER TARGETING
==================================================

If Target Role Type is "BPO", targeting BPO does NOT mean the applicant
has BPO experience. Only emphasize customer service, communication, or
support-related experience that is actually present in the profile. Do
NOT claim previous BPO/call-center experience, shift availability, or
English proficiency unless explicitly supported by the profile.

==================================================
OUTPUT REQUIREMENTS
==================================================

Produce, in this order:

1. matchLevel — exactly one of "Strong Match", "Partial Match", "Limited Match".

2. matchNote — 1-2 plain-language sentences explaining the classification.

3. 3-4 tailored resume bullet points. Each bullet must:
   - Be ATS-friendly, use a strong-but-TRUTHFUL action verb.
   - Be directly supported by the applicant profile, in wording no
     stronger or more specialized than the profile's own language.
   - Emphasize whatever genuine overlap exists with the job description.
   - For a Limited Match, stay close to the candidate's actual words —
     do not reach for the job posting's vocabulary.

4. introMessage — 2-4 sentences. For a Strong or Partial Match, this can
   express genuine interest in the role. For a Limited Match, this must
   NOT imply the candidate is positioned to perform the job's core
   function — it may honestly note transferable skills and interest in
   growth, but must not claim alignment that doesn't exist.

==================================================
FINAL CHECK BEFORE RESPONDING
==================================================

Before producing the JSON, internally verify every factual statement
AND every word choice:

"Can this exact claim, and this exact level of seniority/specialization
in wording, be directly supported by the applicant profile?"

If NO: remove or rewrite it in plainer, more literal language.
If YES: it may be included.

Do not explain this process in the output. Return ONLY the requested JSON.
`.trim()

  return baseInstructions
}

async function callGroq(prompt: string): Promise<string> {
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
            bulletPoints: {
              type: "array",
              minItems: 3,
              maxItems: 4,
              items: {
                type: "string",
              },
            },
            introMessage: {
              type: "string",
            },
          },
          required: ["matchLevel", "matchNote", "bulletPoints", "introMessage"],
          additionalProperties: false,
        },
      },
    },

    temperature: 0.4,
    max_tokens: 1024,
  })

  return completion.choices[0]?.message?.content ?? ""
}

const VALID_MATCH_LEVELS: MatchLevel[] = ["Strong Match", "Partial Match", "Limited Match"]

function parseTailorResult(raw: string): TailorResult | null {
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
      !Array.isArray(parsed.bulletPoints) ||
      typeof parsed.introMessage !== "string"
    ) {
      return null
    }

    const bulletPoints = parsed.bulletPoints.filter(
      (item: unknown): item is string =>
        typeof item === "string" && item.trim().length > 0,
    )

    if (bulletPoints.length < 3 || bulletPoints.length > 4) {
      return null
    }

    return {
      matchLevel: parsed.matchLevel,
      matchNote: parsed.matchNote.trim(),
      bulletPoints,
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

    const prompt = buildTailoringPrompt(profile as Record<string, unknown>, trimmedJobDescription)

    let rawResponse = await callGroq(prompt)
    let result = parseTailorResult(rawResponse)

    // One retry if the first response didn't come back as valid JSON —
    // cheap insurance against an occasional malformed response.
    if (!result) {
      console.warn("First tailor attempt unparseable, retrying once.")
      rawResponse = await callGroq(prompt)
      result = parseTailorResult(rawResponse)
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