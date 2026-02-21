import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SYSTEM_PROMPT = `You are a VA disability rating estimation engine. Based on the evidence provided (conditions, documents, evidence snippets, gap analysis), estimate the likely VA disability rating.

Use the VA Schedule for Rating Disabilities (VASRD) criteria. Consider:
- Each condition's likely individual rating based on severity evidence
- Combined rating using VA math (not simple addition)
- Evidence strength - weak evidence = lower estimated rating
- Whether service connection is established

Return ONLY valid JSON (no markdown, no code blocks):
{
  "estimated_combined_rating": 70,
  "individual_ratings": [
    {
      "condition": "PTSD",
      "estimated_rating": 50,
      "vasrd_code": "9411",
      "rationale": "Evidence shows occupational impairment with reduced reliability...",
      "evidence_strength": "strong|moderate|weak",
      "key_factors": ["documented nightmares", "documented avoidance behaviors"]
    }
  ],
  "va_math_explanation": "50% + 30% = 65% -> rounds to 70%",
  "improvement_opportunities": [
    {
      "condition": "PTSD",
      "current_estimated": 50,
      "potential_rating": 70,
      "what_would_help": "Get a detailed nexus letter and document frequency of panic attacks"
    }
  ],
  "confidence": "moderate",
  "disclaimer": "This is an AI estimate only. Actual ratings are determined by the VA."
}`;

export async function POST(request: NextRequest) {
  try {
    const { caseId } = await request.json();

    const [condRes, snippetRes, docRes, gapRes, caseRes] = await Promise.all([
      supabase.from("conditions").select("*").eq("case_id", caseId),
      supabase.from("evidence_snippets").select("*").eq("case_id", caseId),
      supabase.from("documents").select("file_name, category, processing_status").eq("case_id", caseId),
      supabase.from("evidence_gaps").select("*").eq("case_id", caseId),
      supabase.from("cases").select("*, veteran:veterans(*)").eq("id", caseId).single(),
    ]);

    const conditions = (condRes.data || []).map((c) => ({
      name: c.name, status: c.status, confidence: c.confidence,
      ai_summary: c.ai_summary, functional_impact: c.functional_impact, symptoms: c.symptoms,
    }));

    const snippets = (snippetRes.data || []).map((s) => ({
      text: s.snippet_text, type: s.snippet_type, confidence: s.confidence,
    }));

    const gaps = (gapRes.data || []).map((g) => ({
      category: g.category_name, status: g.gap_status, description: g.description,
    }));

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      `Estimate VA disability rating for this case:

Veteran: ${caseRes.data?.veteran?.first_name} ${caseRes.data?.veteran?.last_name}
Branch: ${caseRes.data?.veteran?.branch_of_service}

Conditions (${conditions.length}):
${JSON.stringify(conditions, null, 2)}

Evidence Snippets (${snippets.length}):
${JSON.stringify(snippets, null, 2)}

Documents: ${docRes.data?.length || 0} uploaded
Evidence Gaps: ${gaps.length} identified
${gaps.length > 0 ? JSON.stringify(gaps, null, 2) : ""}`,
    ]);

    const raw = result.response.text().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(raw);

    return NextResponse.json({ success: true, ...parsed });
  } catch (error) {
    console.error("Rating estimator error:", error);
    return NextResponse.json({ error: "Rating estimation failed" }, { status: 500 });
  }
}
