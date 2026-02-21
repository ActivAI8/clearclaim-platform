import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SYSTEM_PROMPT = `You are a C&P (Compensation & Pension) exam preparation coach for veterans. Your job is to help veterans prepare for their upcoming VA C&P exams.

For the given condition, provide:
1. **What to Expect**: What will happen during the exam for this specific condition
2. **Key Questions**: Common questions the examiner will ask
3. **Tips for Accuracy**: How to accurately describe symptoms (worst days, not best days)
4. **Common Mistakes**: Things veterans do that hurt their claim
5. **What to Bring**: Documents or items to bring

CRITICAL RULES:
- Never tell veterans to exaggerate or lie
- Emphasize describing their WORST days, not average days
- Remind them the exam is a snapshot - describe the full range of symptoms
- Encourage them to mention ALL symptoms, even embarrassing ones
- Remind them to describe functional impact, not just pain levels
- Be specific to the condition - generic advice is less helpful

Return ONLY valid JSON (no markdown, no code blocks):
{
  "what_to_expect": "...",
  "key_questions": ["..."],
  "tips": ["..."],
  "common_mistakes": ["..."],
  "what_to_bring": ["..."],
  "exam_duration": "...",
  "important_note": "..."
}`;

export async function POST(request: NextRequest) {
  try {
    const { conditionName, conditionId, caseId } = await request.json();

    let context = "";
    if (caseId) {
      const { data: snippets } = await supabase
        .from("evidence_snippets")
        .select("snippet_text, snippet_type")
        .eq("case_id", caseId)
        .limit(10);

      if (snippets && snippets.length > 0) {
        context = `\n\nExisting evidence snippets for context:\n${snippets.map((s) => `- [${s.snippet_type}] ${s.snippet_text}`).join("\n")}`;
      }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      `Prepare a C&P exam guide for: ${conditionName}${conditionId ? ` (condition ID: ${conditionId})` : ""}${context}`,
    ]);

    const raw = result.response.text().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const prep = JSON.parse(raw);

    return NextResponse.json({ success: true, prep });
  } catch (error) {
    console.error("C&P prep error:", error);
    return NextResponse.json({ error: "Failed to generate prep guide" }, { status: 500 });
  }
}
