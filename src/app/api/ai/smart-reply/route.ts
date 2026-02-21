import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SYSTEM_PROMPT = `You are a VA disability claims messaging assistant for VSO caseworkers. Based on the case context and recent message history, suggest 3 contextually appropriate reply messages the caseworker might send to the veteran.

Consider:
- The case status and what stage they're in
- Outstanding tasks or missing evidence
- Recent conversation context
- Appropriate professional but warm tone
- Actionable next steps

Return ONLY valid JSON (no markdown, no code blocks):
{
  "suggestions": [
    {
      "label": "Brief label (5-8 words)",
      "message": "The full suggested message text"
    }
  ]
}

Keep messages concise, warm, and actionable. Max 2-3 sentences each.`;

export async function POST(request: NextRequest) {
  try {
    const { caseId, recentMessages } = await request.json();

    const [caseRes, condRes, taskRes] = await Promise.all([
      supabase.from("cases").select("*, veteran:veterans(*)").eq("id", caseId).single(),
      supabase.from("conditions").select("name, status").eq("case_id", caseId),
      supabase.from("veteran_tasks").select("title, status").eq("case_id", caseId),
    ]);

    const vet = caseRes.data?.veteran;
    const pendingTasks = (taskRes.data || []).filter((t) => t.status !== "completed");

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      `Suggest 3 reply messages for this case:

Veteran: ${vet?.first_name} ${vet?.last_name}
Case status: ${caseRes.data?.status}
Conditions: ${(condRes.data || []).map((c) => c.name).join(", ")}
Pending tasks: ${pendingTasks.map((t) => t.title).join(", ") || "None"}

Recent messages:
${(recentMessages || []).slice(-5).map((m: { sender_type: string; content: string }) => `[${m.sender_type}]: ${m.content}`).join("\n")}`,
    ]);

    const raw = result.response.text().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(raw);

    return NextResponse.json({ success: true, suggestions: parsed.suggestions || [] });
  } catch (error) {
    console.error("Smart reply error:", error);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
