import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"
import { createClient } from "@/utils/supabase/server"

// Place this file at:
// src/app/api/tailor/route.ts
//
// Required environment variables:
// GROQ_API_KEY=gsk_...
// GROQ_MODEL=openai/gpt-oss-120b
//
// Install:
// npm install groq-sdk

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

interface TailorRequestBody {
  jobDescription: string
}

interface TailorResult {
  bulletPoints: string[]
  introMessage: string
}

function buildTailoringPrompt(
  profile: Record<string, unknown>,
  jobDescription: string,
) {
  const baseInstructions = `
You are a resume-tailoring assistant.

Your job is to tailor a candidate's resume content to a specific job
description while remaining completely truthful.

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

   Example:
   Target role = BPO

   This does NOT mean:
   "The applicant has BPO experience."

8. NEVER claim shift availability unless the applicant profile explicitly
   says the applicant is available for shifts.

9. NEVER claim onsite availability unless the applicant profile explicitly
   says the applicant is willing or available to work onsite.

10. NEVER claim remote-work availability unless the applicant profile
    explicitly supports it.

11. NEVER claim work authorization, visa status, or "no sponsorship required"
    unless that information is explicitly present in the applicant profile.

12. NEVER invent salary expectations or compensation.

13. NEVER invent metrics, percentages, achievements, KPIs, awards,
    performance results, or numbers.

14. NEVER convert a job requirement into a candidate qualification.

15. If the job description requires something that the applicant profile
    does not establish, DO NOT claim that the candidate has it.

16. Tailoring means emphasizing relevant existing experience.
    Tailoring does NOT mean creating new experience.

==================================================
EXAMPLES
==================================================

JOB:
"Experience with CRM systems."

PROFILE:
"Updated customer records."

CORRECT:
"Updated customer records accurately."

INCORRECT:
"Experienced with CRM systems."

Why:
The profile does not establish that the applicant used a CRM.

--------------------------------------------------

JOB:
"Willing to work shifting schedules."

PROFILE:
No information about shift availability.

CORRECT:
Do not mention shift availability.

INCORRECT:
"I am available for shifting schedules."

--------------------------------------------------

JOB:
"BPO experience required."

PROFILE:
"Customer Service Representative at ABC Solutions."

CORRECT:
"Provided customer service support to customers."

INCORRECT:
"Worked in a fast-paced BPO environment."

Why:
The profile does not establish that ABC Solutions was a BPO.

--------------------------------------------------

JOB:
"Must be available for remote work."

PROFILE:
No remote-work information.

CORRECT:
Do not claim remote availability.

INCORRECT:
"I am available to work remotely."

--------------------------------------------------

JOB:
"No visa sponsorship required."

PROFILE:
No work-authorization information.

CORRECT:
Do not mention visa sponsorship.

INCORRECT:
"I can work without visa sponsorship."

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
${profile.work_setup ?? "Not provided"}

Timezone Overlap:
${profile.timezone_overlap ?? "Not provided"}

Expected Salary:
${profile.expected_salary ?? "Not provided"}

==================================================
TAILORING LOGIC
==================================================

Use the job description to determine:

- Which existing candidate experience is relevant
- Which existing skills should be emphasized
- Which keywords can naturally be used IF they are supported by the profile
- Which responsibilities from the candidate's existing experience are most
  relevant to the job

Use the applicant profile to determine:

- What the applicant has actually done
- What skills the applicant actually has
- What tools the applicant actually knows
- What industries the applicant has actually worked in
- What work arrangements and availability the applicant has actually stated
- What compensation information the applicant has actually provided

The final output should be the intersection between:

JOB REQUIREMENTS
+
SUPPORTED CANDIDATE EXPERIENCE

Do NOT fill gaps by guessing.

==================================================
TARGET MARKET
==================================================

If Target Market is "Local PH":

- Use natural Philippine professional resume language.
- If an expected salary is explicitly provided, it may be expressed in PHP.
- Do not invent salary expectations.
- Do not invent onsite or local availability.

If Target Market is "Global Remote":

- Use concise international professional language.
- Do not include age, civil status, religion, or photo references.
- Mention timezone availability ONLY if explicitly provided.
- Mention remote availability ONLY if explicitly provided.
- Mention work authorization or visa status ONLY if explicitly provided.
- Do not invent international salary expectations.

==================================================
BPO / CALL CENTER TARGETING
==================================================

If Target Role Type is "BPO":

The applicant is TARGETING a BPO/Call Center position.

IMPORTANT:
Targeting BPO does NOT mean the applicant has BPO experience.

You may emphasize existing experience involving:

- Customer service
- Customer communication
- Phone support
- Email support
- Chat support
- Problem solving
- Documentation
- Record keeping
- Team collaboration

ONLY when those things are actually present in the applicant profile.

Do NOT claim:

- Previous BPO experience
- Call center experience
- Graveyard shift availability
- Shifting schedule availability
- English proficiency
- Specific BPO metrics
- Specific BPO tools

unless explicitly supported by the applicant profile.

==================================================
OUTPUT REQUIREMENTS
==================================================

Create:

1. 3-4 tailored resume bullet points.

Each bullet must:

- Be ATS-friendly.
- Use a strong action verb.
- Be concise and professional.
- Be directly supported by the applicant profile.
- Emphasize experience relevant to the job description.
- Never introduce unsupported facts.

2. A short cover/introduction message of 2-4 sentences.

The message must:

- Be tailored to the job.
- Use only facts supported by the applicant profile.
- Avoid unsupported claims about availability.
- Avoid unsupported claims about work authorization.
- Avoid unsupported claims about remote work.
- Avoid unsupported claims about salary.
- Avoid claiming qualifications simply because the job description asks for them.

==================================================
FINAL CHECK BEFORE RESPONDING
==================================================

Before producing the JSON, internally verify every factual statement.

For every candidate-related claim, ask:

"Can this exact claim be supported by the applicant profile?"

If NO:
Remove or rewrite it.

If YES:
It may be included.

Do not explain this process in the output.

Return ONLY the requested JSON.
`.trim()

  return baseInstructions
}

async function callGroq(prompt: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",

    messages: [
      {
        role: "system",
        content:
          "You are an expert resume writer and career coach. " +
          "You must never invent or assume candidate facts. " +
          "Return only the requested structured JSON.",
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
          required: ["bulletPoints", "introMessage"],
          additionalProperties: false,
        },
      },
    },

    temperature: 0.4,
    max_tokens: 1024,
  })

  return completion.choices[0]?.message?.content ?? ""
}

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
      bulletPoints,
      introMessage: parsed.introMessage.trim(),
    }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // --------------------------------------------------
    // 1. Validate request body
    // --------------------------------------------------

    const body: TailorRequestBody = await request.json()

    const { jobDescription } = body

    if (
      typeof jobDescription !== "string" ||
      !jobDescription.trim()
    ) {
      return NextResponse.json(
        {
          error: "Job description is required.",
        },
        { status: 400 },
      )
    }

    // Optional protection against extremely large job descriptions.
    const trimmedJobDescription = jobDescription.trim()

    if (trimmedJobDescription.length > 30000) {
      return NextResponse.json(
        {
          error:
            "Job description is too long. Please provide a shorter job posting.",
        },
        { status: 400 },
      )
    }

    // --------------------------------------------------
    // 2. Check authentication
    // --------------------------------------------------

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Not authenticated.",
        },
        { status: 401 },
      )
    }

    // --------------------------------------------------
    // 3. Load applicant profile
    // --------------------------------------------------

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (profileError) {
      console.error("Profile lookup error:", profileError)

      return NextResponse.json(
        {
          error: "Unable to load your profile.",
        },
        { status: 500 },
      )
    }

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "Complete your profile in Onboarding before tailoring a resume.",
        },
        { status: 400 },
      )
    }

    // --------------------------------------------------
    // 4. Build prompt
    // --------------------------------------------------

    const prompt = buildTailoringPrompt(
      profile as Record<string, unknown>,
      trimmedJobDescription,
    )

    // --------------------------------------------------
    // 5. Call Groq
    // --------------------------------------------------

    const rawResponse = await callGroq(prompt)

    if (!rawResponse) {
      console.error("Groq returned an empty response.")

      return NextResponse.json(
        {
          error: "The AI returned an empty response. Please try again.",
        },
        { status: 502 },
      )
    }

    // --------------------------------------------------
    // 6. Parse structured response
    // --------------------------------------------------

    const result = parseTailorResult(rawResponse)

    if (!result) {
      console.error("Unable to parse Groq response:", rawResponse)

      return NextResponse.json(
        {
          error:
            "The AI response couldn't be parsed. Please try again.",
        },
        { status: 502 },
      )
    }

    // --------------------------------------------------
    // 7. Return result
    // --------------------------------------------------

    return NextResponse.json(result)
  } catch (err) {
    console.error("Tailor API error:", err)

    return NextResponse.json(
      {
        error: "Something went wrong while tailoring.",
      },
      { status: 500 },
    )
  }
}
