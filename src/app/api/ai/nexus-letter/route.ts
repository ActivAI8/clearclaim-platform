import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SYSTEM_PROMPT = `You are a medical-legal document specialist. Generate a template nexus letter for a veteran's treating physician to review, customize, and sign.

A nexus letter must:
1. Be addressed from a medical professional
2. State the veteran's condition
3. Provide a medical opinion on service connection ("at least as likely as not")
4. Reference the veteran's service records and medical history
5. Explain the medical reasoning for the connection
6. Include appropriate medical terminology

Generate a professional template with [BRACKETS] for fields the doctor needs to fill in.

IMPORTANT: This is a TEMPLATE for a doctor to review and modify. Include clear notes about what the doctor should customize.`;

export async function POST(request: NextRequest) {
  try {
    const { caseId, conditionId } = await request.json();

    const [caseRes, condRes, snippetRes] = await Promise.all([
      supabase.from("cases").select("*, veteran:veterans(*)").eq("id", caseId).single(),
      supabase.from("conditions").select("*").eq("id", conditionId).single(),
      supabase.from("evidence_snippets").select("snippet_text, snippet_type").eq("case_id", caseId).limit(15),
    ]);

    const vet = caseRes.data?.veteran;
    const condition = condRes.data;

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      `Generate a nexus letter template for:

Veteran: ${vet?.first_name} ${vet?.last_name}
Branch: ${vet?.branch_of_service}
Service: ${vet?.service_start_date || "[SERVICE START]"} to ${vet?.service_end_date || "[SERVICE END]"}

Condition: ${condition?.name}
ICD Code: ${condition?.icd_code || "Not yet coded"}
AI Summary: ${condition?.ai_summary || "N/A"}
Functional Impact: ${condition?.functional_impact || "N/A"}
Symptoms: ${condition?.symptoms?.join(", ") || "N/A"}

Evidence snippets:
${(snippetRes.data || []).map((s) => `- [${s.snippet_type}] ${s.snippet_text}`).join("\n")}`,
    ]);

    const letter = result.response.text();
    return NextResponse.json({ success: true, letter, conditionName: condition?.name });
  } catch (error) {
    console.error("Nexus letter error:", error);
    return NextResponse.json({ error: "Nexus letter generation failed" }, { status: 500 });
  }
}
