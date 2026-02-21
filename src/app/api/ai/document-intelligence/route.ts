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

    const { data: documents } = await supabase
      .from("documents")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    const { data: conditions } = await supabase
      .from("case_conditions")
      .select("*")
      .eq("case_id", caseId);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: `You are an AI document intelligence engine for VA disability claims. Based on the documents and conditions on file, generate a realistic activity feed of AI-extracted insights.

For each document, generate 1-3 intelligence findings that would be extracted from that type of document. Make them specific, actionable, and reference page numbers.

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "insights": [
    {
      "id": "unique-id",
      "documentName": "file name",
      "documentCategory": "category",
      "type": "diagnosis_found" | "nexus_detected" | "treatment_gap" | "service_event" | "symptom_mention" | "medication_found" | "specialist_referral" | "rating_relevant",
      "title": "Short title",
      "detail": "Specific finding with page reference",
      "conditionLink": "which condition this relates to or null",
      "significance": "high" | "medium" | "low",
      "timestamp": "ISO timestamp"
    }
  ],
  "summary": {
    "totalFindings": 0,
    "highSignificance": 0,
    "conditionsCovered": 0,
    "documentsAnalyzed": 0
  }
}

Generate findings that feel realistic and specific. Reference specific page numbers, dates, doctor names (generate realistic ones), and medical terminology appropriate to the conditions.`,
    });

    const prompt = `Generate document intelligence feed for this case:

Documents on file:
${(documents || []).map((d: Record<string, unknown>) => `- ${d.file_name} (category: ${d.category}, uploaded: ${d.created_at}, size: ${d.file_size} bytes)`).join("\n") || "No documents yet"}

Conditions claimed:
${(conditions || []).map((c: Record<string, unknown>) => `- ${c.name}`).join("\n") || "None"}

Generate the intelligence feed now.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const feed = JSON.parse(text);

    return NextResponse.json(feed);
  } catch (error) {
    console.error("Document intelligence error:", error);
    return NextResponse.json(
      { error: "Failed to generate document intelligence" },
      { status: 500 }
    );
  }
}
