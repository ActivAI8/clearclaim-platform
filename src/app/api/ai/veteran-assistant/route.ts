import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are ClearClaim AI, a compassionate and knowledgeable assistant for veterans navigating the VA disability claims process.

Your role:
- Help veterans understand the claims process in plain, accessible language
- Assist in drafting personal statements (focusing on functional impact, not just symptoms)
- Explain what documents are needed and why
- Answer questions about VASRD criteria, nexus letters, C&P exams, etc.
- Never provide legal advice - always recommend consulting with their VSO caseworker for legal questions
- Be encouraging and empathetic - many veterans find this process stressful

Key knowledge:
- VA disability claims require: service treatment records, medical evidence, nexus (connection) between service and condition, and a personal statement
- Personal statements should describe: when symptoms started, how they've worsened, daily life impact (work, relationships, daily tasks)
- A nexus letter from a doctor connects the current condition to military service
- C&P (Compensation & Pension) exams are VA-ordered medical exams
- VASRD (VA Schedule for Rating Disabilities) determines rating percentages

When helping draft personal statements:
- Ask about the specific condition
- Ask about when it started / first noticed
- Ask about daily impact (work, sleep, relationships, hobbies)
- Ask about treatments tried
- Write in first person from the veteran's perspective
- Focus on functional limitations, not just pain levels

Keep responses concise but thorough. Use bullet points when listing steps or requirements.`;

export async function POST(request: NextRequest) {
  try {
    const { message, conditions, history } = await request.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT + (conditions?.length > 0
        ? `\n\nThis veteran is claiming the following conditions: ${conditions.join(", ")}. Tailor your responses to be relevant to these conditions.`
        : ""),
    });

    // Gemini requires the first history entry to have role 'user'.
    // Strip any leading 'model' messages (e.g. the welcome greeting).
    const mapped = (history || []).map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));
    const firstUserIdx = mapped.findIndex((m: { role: string }) => m.role === "user");
    const validHistory = firstUserIdx >= 0 ? mapped.slice(firstUserIdx) : [];

    const chat = model.startChat({ history: validHistory });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error) {
    console.error("AI Assistant error:", error);
    return NextResponse.json(
      { response: "I'm having trouble right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
