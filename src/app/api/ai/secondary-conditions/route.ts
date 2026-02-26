import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SYSTEM_PROMPT = `You are a VA disability claims expert specializing in secondary and presumptive conditions. Given a veteran's primary claimed conditions and service history, suggest additional conditions they may be eligible to claim.

Consider:
- Secondary conditions (caused or aggravated by a primary service-connected condition)
- Presumptive conditions (conditions the VA presumes are service-connected based on service era/location)
- Commonly co-occurring conditions
- Agent Orange, burn pit, Gulf War illness presumptives if applicable

Return ONLY valid JSON (no markdown, no code blocks):
{
  "suggestions": [
    {
      "condition_name": "...",
      "type": "secondary|presumptive|commonly_co-occurring",
      "related_to": "Name of the primary condition it's related to",
      "rationale": "Why this veteran might be eligible",
      "vasrd_code": "...",
      "estimated_rating_range": "10-30%",
      "evidence_needed": "What would be needed to claim this",
      "confidence": 0.8
    }
  ],
  "note": "Brief note about the suggestions"
}

Only suggest conditions with genuine medical/legal basis. Do not suggest frivolous claims.`;

export async function POST(request: NextRequest) {
  try {
    const { caseId } = await request.json();

    const [caseRes, condRes] = await Promise.all([
      supabase.from("cases").select("*, veteran:veterans(*)").eq("id", caseId).single(),
      supabase.from("conditions").select("*").eq("case_id", caseId),
    ]);

    const vet = caseRes.data?.veteran;
    const conditions = condRes.data || [];

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      `Suggest secondary/presumptive conditions for:

Veteran: ${vet?.first_name} ${vet?.last_name}
Branch: ${vet?.branch_of_service}
Service: ${vet?.service_start_date || "Unknown"} to ${vet?.service_end_date || "Unknown"}
Discharge: ${vet?.discharge_status || "Unknown"}

Current claimed conditions:
${conditions.map((c) => `- ${c.name} (${c.status}, confidence: ${c.confidence})`).join("\n")}`,
    ]);

    const raw = result.response.text().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(raw);

    return NextResponse.json({ success: true, ...parsed });
  } catch (error) {
    console.error("Secondary conditions error:", error);
    return NextResponse.json({ error: "Suggestion generation failed" }, { status: 500 });
  }
}
