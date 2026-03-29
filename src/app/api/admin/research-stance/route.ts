import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const VALID_TOPICS = [
  "housing", "transit", "safety", "cost-of-living", "education",
  "sanitation", "micromobility", "environment", "land-use",
  "justice-reform", "immigrant-rights",
];

export async function POST(request: NextRequest) {
  const { prompt, candidateName } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const systemPrompt = `You are a political research assistant. The user will ask about a candidate's stance on a topic. Research it using web search and return a structured JSON response.

${candidateName ? `Candidate: ${candidateName}` : ""}

Return ONLY valid JSON with this structure:
{
  "topic_slug": one of: ${VALID_TOPICS.join(", ")},
  "summary": "1-2 sentence summary of their position",
  "full_text": "longer explanation with details",
  "source_url": "URL where this info was found",
  "source_name": "name of the source"
}

Pick the most relevant topic_slug from the list. No markdown, no explanation — just the JSON object.`;

  try {
    const response = await genai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }],
      },
    });

    const raw = response.text?.trim() || "{}";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    let stance;
    try {
      stance = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response", raw }, { status: 500 });
    }

    // Validate topic_slug
    if (stance.topic_slug && !VALID_TOPICS.includes(stance.topic_slug)) {
      stance.topic_slug = "housing"; // fallback
    }

    return NextResponse.json({ stance });
  } catch (err) {
    console.error("Stance research error:", err);
    return NextResponse.json({ error: "Research failed" }, { status: 500 });
  }
}
