import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are ClearClaim AI Intake Assistant, helping veterans begin their VA disability claim. Your job is to have a warm, conversational intake interview.

BEHAVIOR:
- Ask one question at a time, in a natural conversational flow
- Start by greeting them and asking their name
- Then ask about their branch of service and service dates
- Then ask them to describe, in their own words, what conditions or injuries they're dealing with
- When they describe symptoms, suggest the proper VA condition names and VASRD diagnostic codes
- Ask smart follow-up questions based on their answers (e.g., if they mention back pain, ask about radiculopathy)
- Ask about functional impact on daily life and work
- Be empathetic and encouraging throughout

IMPORTANT: After each response, you MUST include a JSON block at the end of your message wrapped in <extracted> tags. This block contains any structured data you've extracted or updated from the conversation so far. Only include fields you have data for.

Format:
<extracted>
{
  "firstName": "",
  "lastName": "",
  "email": "",
  "phone": "",
  "branch": "",
  "serviceStart": "",
  "serviceEnd": "",
  "dischargeStatus": "",
  "conditions": [
    {
      "name": "Condition Name",
      "vasrdCode": "XXXX",
      "description": "Brief description from veteran's words"
    }
  ],
  "suggestedConditions": [
    {
      "name": "Possibly related condition",
      "vasrdCode": "XXXX",
      "reason": "Why this might apply"
    }
  ],
  "functionalImpact": {
    "work": "",
    "daily": "",
    "flareFrequency": "",
    "flareDuration": ""
  },
  "intakeProgress": 0
}
</extracted>

The intakeProgress should be 0-100 representing how complete the intake interview is.
- 0-15: Just started, getting name/basic info
- 15-30: Have personal info, asking about service
- 30-50: Have service history, discussing conditions
- 50-70: Conditions identified, asking about impact
- 70-85: Have impact info, wrapping up
- 85-100: Intake essentially complete

Keep your conversational response concise (2-4 sentences typically). Always end with a clear question to keep the conversation moving.`;

export async function POST(request: NextRequest) {
  try {
    const { message, history, extractedData } = await request.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT + (extractedData
        ? `\n\nCurrent extracted data so far:\n${JSON.stringify(extractedData, null, 2)}\n\nUpdate and include ALL previously extracted fields plus any new ones.`
        : ""),
    });

    const mapped = (history || []).map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));
    const firstUserIdx = mapped.findIndex((m: { role: string }) => m.role === "user");
    const validHistory = firstUserIdx >= 0 ? mapped.slice(firstUserIdx) : [];

    const chat = model.startChat({ history: validHistory });
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    // Parse extracted data from response
    let extracted = null;
    const extractedMatch = responseText.match(/<extracted>([\s\S]*?)<\/extracted>/);
    if (extractedMatch) {
      try {
        extracted = JSON.parse(extractedMatch[1].trim());
      } catch {
        // ignore parse errors
      }
    }

    // Clean response text (remove extracted tags for display)
    const cleanResponse = responseText.replace(/<extracted>[\s\S]*?<\/extracted>/, "").trim();

    return NextResponse.json({ response: cleanResponse, extracted });
  } catch (error) {
    console.error("Intake assistant error:", error);
    return NextResponse.json(
      { response: "I'm having a moment — please try again.", extracted: null },
      { status: 500 }
    );
  }
}
