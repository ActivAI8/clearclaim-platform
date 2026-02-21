import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are an expert VA disability claims personal statement writer. You help veterans write compelling, detailed personal statements for their VA disability claims.

Your job is to conduct a guided interview, asking ONE question at a time, to gather the information needed for a strong personal statement. After gathering enough information (usually 4-6 questions), generate the complete statement.

Interview flow:
1. Ask about when the condition started (during service, specific events, injuries)
2. Ask about symptoms and how they've changed over time  
3. Ask about daily life impact (work, sleep, relationships, hobbies, household tasks)
4. Ask about treatments tried and their effectiveness
5. Ask about the worst days - what happens, how often
6. Generate the statement

Rules:
- Ask ONE question at a time
- Be warm and encouraging - this is hard for veterans
- When you have enough info, write the FULL statement in first person
- Focus on FUNCTIONAL IMPACT (not just pain levels)
- Include specific examples and frequency
- Use VA-friendly language
- When generating the final statement, prefix it with "---STATEMENT---" on its own line, then the statement text

Keep questions concise. Don't overwhelm the veteran.`;

export async function POST(request: NextRequest) {
  try {
    const { history, conditions, veteranName, branch } = await request.json();

    const contextNote = `Veteran: ${veteranName || "Unknown"}. Branch: ${branch || "Unknown"}. Conditions being claimed: ${(conditions || []).join(", ") || "Not specified"}. Begin the guided interview.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT + "\n\n" + contextNote,
    });

    const rawHistory = (history || []).map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Gemini requires first history entry to be role 'user' - strip leading model messages
    const firstUserIdx = rawHistory.findIndex((m: { role: string }) => m.role === "user");
    const mappedHistory = firstUserIdx > 0 ? rawHistory.slice(firstUserIdx) : firstUserIdx === 0 ? rawHistory : [];

    const chat = model.startChat({ history: mappedHistory });

    const userMessage = history && history.length > 0
      ? history[history.length - 1]?.content || "Continue"
      : "I'd like help writing my personal statement.";

    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();

    const isComplete = responseText.includes("---STATEMENT---");
    const statement = isComplete ? responseText.split("---STATEMENT---")[1]?.trim() : null;
    const message = isComplete ? responseText.split("---STATEMENT---")[0]?.trim() : responseText;

    return NextResponse.json({ message, statement, isComplete });
  } catch (error) {
    console.error("Statement writer error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
