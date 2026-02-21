import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { veteranName, branch, serviceStart, serviceEnd, conditions, buddyName, buddyRelationship, specificEvents } = await request.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: `You are a VA disability claims expert specializing in writing buddy/lay statements.

Generate a professional buddy statement (also called a "buddy letter" or "lay statement") that a fellow service member, family member, or friend can customize and sign.

REQUIREMENTS:
- Write in first person from the buddy's perspective
- Include a declaration of identity and relationship to the veteran
- Reference specific observed symptoms, behaviors, or incidents
- Use concrete, descriptive language (not medical terminology)
- Describe changes observed before/during/after service
- Include impact on daily life, work, relationships as witnessed
- End with a declaration of truthfulness
- Format as a proper letter with date placeholder

IMPORTANT: Make the statement specific to the conditions claimed. For each condition, include at least 2-3 specific observable behaviors or incidents the buddy would have witnessed.

The statement should be 400-600 words and ready to customize.`,
    });

    const prompt = `Generate a buddy statement for:

Veteran: ${veteranName || "the veteran"}
Branch: ${branch || "U.S. Military"}
Service Period: ${serviceStart || "N/A"} to ${serviceEnd || "N/A"}
Conditions: ${conditions?.join(", ") || "not specified"}
Buddy Name: ${buddyName || "[BUDDY NAME]"}
Relationship: ${buddyRelationship || "[RELATIONSHIP - e.g., fellow service member, spouse, close friend]"}
${specificEvents ? `Specific events to reference: ${specificEvents}` : ""}

Generate the buddy statement now.`;

    const result = await model.generateContent(prompt);
    const statement = result.response.text();

    return NextResponse.json({ statement });
  } catch (error) {
    console.error("Buddy statement error:", error);
    return NextResponse.json(
      { error: "Failed to generate buddy statement" },
      { status: 500 }
    );
  }
}
