import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { caseId } = await request.json();

    // Fetch case data
    const { data: conditions } = await supabase
      .from("case_conditions")
      .select("*")
      .eq("case_id", caseId);

    const { data: documents } = await supabase
      .from("documents")
      .select("*")
      .eq("case_id", caseId);

    const { data: gaps } = await supabase
      .from("evidence_gaps")
      .select("*")
      .eq("case_id", caseId);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a VA disability claims evidence analyst. Analyze the evidence on file for each claimed condition and produce a sufficiency scorecard.

For each condition, evaluate whether the following evidence types exist:
1. Service Treatment Records (STR) - military medical records showing in-service event/treatment
2. Medical Diagnosis - current diagnosis from a qualified provider
3. Nexus Letter - medical opinion linking condition to service
4. Personal Statement - veteran's own account of condition impact
5. Buddy Statement - lay witness statement corroborating symptoms
6. Disability Benefits Questionnaire (DBQ) - standardized VA medical form
7. Treatment Records - ongoing treatment showing continuity of care

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "conditions": [
    {
      "conditionId": "id",
      "conditionName": "name",
      "overallScore": 0-100,
      "evidenceTypes": [
        {
          "type": "str",
          "label": "Service Treatment Records",
          "status": "present" | "missing" | "partial",
          "details": "brief explanation",
          "priority": "critical" | "important" | "helpful"
        }
      ],
      "recommendation": "Top priority action for this condition"
    }
  ],
  "overallReadiness": 0-100,
  "topActions": ["action 1", "action 2", "action 3"]
}`,
    });

    const prompt = `Analyze evidence sufficiency for this VA disability case:

Conditions claimed:
${(conditions || []).map((c: Record<string, unknown>) => `- ${c.name} (status: ${c.status})`).join("\n")}

Documents on file:
${(documents || []).map((d: Record<string, unknown>) => `- ${d.file_name} (category: ${d.category}, status: ${d.processing_status})`).join("\n") || "None"}

Known evidence gaps:
${(gaps || []).map((g: Record<string, unknown>) => `- ${g.category_name}: ${g.gap_status} - ${g.description || ""}`).join("\n") || "None identified"}

Produce the evidence sufficiency scorecard.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const scorecard = JSON.parse(text);

    return NextResponse.json(scorecard);
  } catch (error) {
    console.error("Evidence scorecard error:", error);
    return NextResponse.json(
      { error: "Failed to generate evidence scorecard" },
      { status: 500 }
    );
  }
}
