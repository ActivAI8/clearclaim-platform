import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SYSTEM_PROMPT = `You are a VA disability claims case narrative writer for VSO (Veterans Service Organization) staff. Generate a professional, comprehensive case narrative summary suitable for inclusion in a claims submission packet.

The narrative should include:
1. **Veteran Overview**: Service history, branch, period of service
2. **Conditions Summary**: Each claimed condition with evidence summary
3. **Evidence Inventory**: Documents and evidence supporting each claim
4. **Service Connection**: How each condition relates to military service
5. **Functional Impact**: How conditions affect the veteran's daily life and employment
6. **Strengths & Weaknesses**: Honest assessment of the case
7. **Recommendations**: Next steps or additional evidence that could strengthen the claim

Write in a professional, factual tone appropriate for VA submission. Be thorough but concise.`;

export async function POST(request: NextRequest) {
  try {
    const { caseId } = await request.json();

    const [caseRes, condRes, docRes, snippetRes, gapRes, taskRes] = await Promise.all([
      supabase.from("cases").select("*, veteran:veterans(*), site:sites(*)").eq("id", caseId).single(),
      supabase.from("conditions").select("*").eq("case_id", caseId),
      supabase.from("documents").select("*").eq("case_id", caseId),
      supabase.from("evidence_snippets").select("*").eq("case_id", caseId),
      supabase.from("evidence_gaps").select("*").eq("case_id", caseId),
      supabase.from("veteran_tasks").select("*").eq("case_id", caseId),
    ]);

    const vet = caseRes.data?.veteran;
    const conditions = condRes.data || [];
    const documents = docRes.data || [];
    const snippets = snippetRes.data || [];
    const gaps = gapRes.data || [];

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      `Generate a case narrative for:

Case: ${caseRes.data?.case_number}
Status: ${caseRes.data?.status}

Veteran: ${vet?.first_name} ${vet?.last_name}
Branch: ${vet?.branch_of_service}
Service: ${vet?.service_start_date || "Unknown"} to ${vet?.service_end_date || "Unknown"}
Discharge: ${vet?.discharge_status || "Unknown"}

Conditions (${conditions.length}):
${conditions.map((c) => `- ${c.name} [${c.status}] confidence: ${c.confidence}, summary: ${c.ai_summary || "N/A"}, functional impact: ${c.functional_impact || "N/A"}`).join("\n")}

Documents (${documents.length}):
${documents.map((d) => `- ${d.file_name} [${d.category}] status: ${d.processing_status}`).join("\n")}

Evidence Snippets (${snippets.length}):
${snippets.slice(0, 20).map((s) => `- [${s.snippet_type}] ${s.snippet_text}`).join("\n")}

Evidence Gaps (${gaps.length}):
${gaps.map((g) => `- ${g.category_name}: ${g.gap_status} - ${g.description || ""}`).join("\n")}

Tasks completed: ${taskRes.data?.filter((t) => t.status === "completed").length || 0}/${taskRes.data?.length || 0}
Packet readiness: ${caseRes.data?.packet_readiness_score || 0}%`,
    ]);

    const narrative = result.response.text();
    return NextResponse.json({ success: true, narrative });
  } catch (error) {
    console.error("Case narrative error:", error);
    return NextResponse.json({ error: "Narrative generation failed" }, { status: 500 });
  }
}
