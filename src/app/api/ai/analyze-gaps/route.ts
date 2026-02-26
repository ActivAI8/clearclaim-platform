import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const GAP_ANALYSIS_PROMPT = `You are an expert VA disability claims analyst. Given a list of claimed conditions and the evidence snippets available, identify evidence gaps.

For each condition, evaluate whether the following evidence categories are supported, partial, or missing:
- Diagnosis: Formal medical diagnosis
- Service Connection: Evidence linking condition to military service
- Treatment History: Ongoing treatment records
- Functional Impact: Description of daily life limitations
- Personal Statement: Veteran's own account
- Buddy Statements: Third-party supporting statements
- Current Severity: Recent medical evaluation of severity

Return ONLY valid JSON (no markdown, no code blocks):
{
  "gaps": [
    {
      "condition_name": "...",
      "condition_id": "...",
      "category": "...",
      "status": "supported|partial|missing",
      "description": "Explanation of what's missing or needs strengthening"
    }
  ],
  "recommended_tasks": [
    {
      "title": "...",
      "description": "...",
      "task_type": "upload|provide_statement|answer_questions|clarify_timeline",
      "priority": "high|medium|low",
      "condition_name": "..."
    }
  ],
  "overall_assessment": "Brief summary of evidence strength"
}`;

export async function POST(request: NextRequest) {
  try {
    const { caseId } = await request.json();

    const { data: conditions } = await supabase.from("conditions").select("*").eq("case_id", caseId);
    const { data: snippets } = await supabase.from("evidence_snippets").select("*").eq("case_id", caseId);
    const { data: documents } = await supabase.from("documents").select("file_name, category, processing_status").eq("case_id", caseId);
    const { data: caseData } = await supabase.from("cases").select("*, veteran:veterans(*)").eq("id", caseId).single();

    const conditionsContext = (conditions || []).map((c) => ({ id: c.id, name: c.name, status: c.status, confidence: c.confidence, ai_summary: c.ai_summary }));
    const snippetsContext = (snippets || []).map((s) => ({ text: s.snippet_text, type: s.snippet_type, confidence: s.confidence }));
    const docsContext = (documents || []).map((d) => ({ name: d.file_name, category: d.category, status: d.processing_status }));

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const result = await model.generateContent([
      GAP_ANALYSIS_PROMPT,
      `Case: ${caseData?.case_number || caseId}
Veteran: ${caseData?.veteran?.first_name} ${caseData?.veteran?.last_name}

Conditions claimed (${conditionsContext.length}):
${JSON.stringify(conditionsContext, null, 2)}

Evidence snippets found (${snippetsContext.length}):
${JSON.stringify(snippetsContext, null, 2)}

Documents uploaded (${docsContext.length}):
${JSON.stringify(docsContext, null, 2)}

Analyze the evidence gaps for each condition.`,
    ]);

    const raw = result.response.text().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(raw);

    if (parsed.gaps && parsed.gaps.length > 0) {
      await supabase.from("evidence_gaps").delete().eq("case_id", caseId);

      for (const gap of parsed.gaps) {
        const cond = (conditions || []).find(
          (c) => c.name.toLowerCase() === gap.condition_name?.toLowerCase() || c.id === gap.condition_id
        );
        if (cond) {
          await supabase.from("evidence_gaps").insert({
            case_id: caseId,
            condition_id: cond.id,
            category_name: gap.category,
            gap_status: gap.status,
            description: gap.description,
          });
        }
      }
    }

    if (parsed.recommended_tasks && parsed.recommended_tasks.length > 0 && caseData?.veteran) {
      for (const task of parsed.recommended_tasks) {
        const { data: existing } = await supabase
          .from("veteran_tasks")
          .select("id")
          .eq("case_id", caseId)
          .ilike("title", `%${task.title}%`)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from("veteran_tasks").insert({
            case_id: caseId,
            veteran_id: caseData.veteran.id || caseData.veteran_id,
            task_type: task.task_type,
            title: task.title,
            description: task.description,
            status: "pending",
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      gaps: parsed.gaps?.length || 0,
      tasks_created: parsed.recommended_tasks?.length || 0,
      assessment: parsed.overall_assessment,
    });
  } catch (error) {
    console.error("Gap analysis error:", error);
    return NextResponse.json({ error: "Gap analysis failed" }, { status: 500 });
  }
}
