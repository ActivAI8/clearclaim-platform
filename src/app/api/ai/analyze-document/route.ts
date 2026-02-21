import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const ANALYSIS_PROMPT = `You are a medical document analysis AI for VA disability claims processing.

Analyze the provided document text and extract structured information:

1. **Conditions Found**: List any medical conditions, diagnoses, or symptoms mentioned
2. **Evidence Snippets**: Extract key facts with their type (diagnosis, treatment, symptom, date, measurement, medication, procedure, lab_result)
3. **Dates**: Any relevant dates (treatment dates, diagnosis dates, onset dates)
4. **Functional Impact**: Any mentions of how conditions affect daily life, work, or activities
5. **Service Connection Indicators**: Any mentions of military service, deployment, service-related events

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "conditions": [{ "name": "...", "icd_hint": "...", "confidence": 0.8, "onset_description": "..." }],
  "snippets": [{ "text": "...", "type": "diagnosis", "confidence": 0.8, "page_hint": null }],
  "functional_impacts": ["..."],
  "service_connection_notes": ["..."],
  "document_summary": "Brief 2-3 sentence summary of the document"
}`;

export async function POST(request: NextRequest) {
  try {
    const { filePath, caseId, fileName } = await request.json();

    await supabase
      .from("documents")
      .update({ processing_status: "ocr_processing", processing_progress: 10 })
      .eq("case_id", caseId)
      .eq("file_path", filePath);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("veteran-documents")
      .download(filePath);

    if (downloadError || !fileData) {
      await supabase
        .from("documents")
        .update({ processing_status: "error" })
        .eq("case_id", caseId)
        .eq("file_path", filePath);
      return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
    }

    await supabase
      .from("documents")
      .update({ processing_status: "extracting", processing_progress: 40 })
      .eq("case_id", caseId)
      .eq("file_path", filePath);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const mimeType = fileData.type;
    let analysisResult: string;

    if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
      const buffer = await fileData.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      const result = await model.generateContent([
        ANALYSIS_PROMPT,
        `Analyze this medical document (${fileName}) for VA disability claim processing.`,
        { inlineData: { mimeType, data: base64 } },
      ]);
      analysisResult = result.response.text();
    } else {
      const text = await fileData.text();
      const result = await model.generateContent([
        ANALYSIS_PROMPT,
        `Analyze this medical document (${fileName}):\n\n${text.substring(0, 15000)}`,
      ]);
      analysisResult = result.response.text();
    }

    // Strip markdown code fences if present
    const cleaned = analysisResult.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const analysis = JSON.parse(cleaned);

    await supabase
      .from("documents")
      .update({ processing_status: "indexing", processing_progress: 70 })
      .eq("case_id", caseId)
      .eq("file_path", filePath);

    const { data: docRecord } = await supabase
      .from("documents")
      .select("id")
      .eq("case_id", caseId)
      .eq("file_path", filePath)
      .single();

    if (!docRecord) {
      return NextResponse.json({ error: "Document record not found" }, { status: 404 });
    }

    if (analysis.snippets && analysis.snippets.length > 0) {
      const snippetRows = analysis.snippets.map((s: { text: string; type: string; confidence: number }) => ({
        case_id: caseId,
        document_id: docRecord.id,
        snippet_text: s.text,
        snippet_type: s.type,
        confidence: s.confidence || 0.8,
        metadata: {},
      }));
      await supabase.from("evidence_snippets").insert(snippetRows);
    }

    if (analysis.conditions && analysis.conditions.length > 0) {
      for (const cond of analysis.conditions) {
        const { data: existing } = await supabase
          .from("conditions")
          .select("id")
          .eq("case_id", caseId)
          .ilike("name", `%${cond.name}%`)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from("conditions").insert({
            case_id: caseId,
            name: cond.name,
            icd_code: cond.icd_hint || null,
            status: "draft",
            confidence: cond.confidence || 0.7,
            onset_description: cond.onset_description || null,
            ai_summary: analysis.document_summary || null,
            functional_impact: analysis.functional_impacts?.join("; ") || null,
            symptoms: [],
            treatments: [],
            conflict_flags: [],
          });
        }
      }
    }

    await supabase
      .from("documents")
      .update({
        processing_status: "complete",
        processing_progress: 100,
        ocr_text: analysis.document_summary || null,
        metadata: {
          ai_analysis: analysis,
          conditions_found: analysis.conditions?.length || 0,
          snippets_extracted: analysis.snippets?.length || 0,
        },
      })
      .eq("case_id", caseId)
      .eq("file_path", filePath);

    try {
      const { data: pendingTasks } = await supabase
        .from("veteran_tasks")
        .select("*")
        .eq("case_id", caseId)
        .in("status", ["sent", "in_progress"]);

      if (pendingTasks && pendingTasks.length > 0) {
        for (const task of pendingTasks) {
          let shouldComplete = false;
          const title = (task.title || "").toLowerCase();
          const lowerFileName = fileName.toLowerCase();

          if (task.task_type === "provide_statement" && (analysis.snippets?.some((s: { type: string }) => s.type === "personal_statement") || lowerFileName.includes("statement"))) {
            shouldComplete = true;
          } else if (task.task_type === "upload") {
            if (title.includes("dd-214") && (lowerFileName.includes("dd214") || lowerFileName.includes("dd-214"))) {
              shouldComplete = true;
            } else if (title.includes("treatment records") && (lowerFileName.includes("medical") || lowerFileName.includes("record") || lowerFileName.includes("str"))) {
              shouldComplete = true;
            } else if (title.includes("nexus") && lowerFileName.includes("nexus")) {
              shouldComplete = true;
            }
          }

          if (shouldComplete) {
            await supabase
              .from("veteran_tasks")
              .update({ status: "completed", completed_at: new Date().toISOString() })
              .eq("id", task.id);

            await supabase.from("case_messages").insert({
              case_id: caseId,
              sender_id: "ai-system",
              sender_type: "staff",
              sender_name: "ClearClaim AI",
              content: `[AI Notification] Automatically completed task: "${task.title}" based on uploaded document: ${fileName}`,
            });
          }
        }
      }
    } catch (taskError) {
      console.error("Task auto-completion error:", taskError);
    }

    return NextResponse.json({
      success: true,
      conditions_found: analysis.conditions?.length || 0,
      snippets_extracted: analysis.snippets?.length || 0,
      summary: analysis.document_summary,
    });
  } catch (error) {
    console.error("Document analysis error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
