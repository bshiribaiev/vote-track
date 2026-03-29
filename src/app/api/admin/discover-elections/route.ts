import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const PROMPT = `Search the web for upcoming elections in New York City. Include city, state, and federal races that affect NYC voters. Focus on elections happening in 2025 and 2026.

For each election found, return a JSON array of objects with these fields:
- title: string (e.g. "Manhattan CD3 Special Election")
- office: string (e.g. "City Council Member, District 3")
- district_type: "city_council" | "state_assembly" | "state_senate" | "congressional" | "statewide" | null
- district_number: string | null (e.g. "3")
- election_date: string (YYYY-MM-DD format)
- early_voting_start: string | null (YYYY-MM-DD)
- early_voting_end: string | null (YYYY-MM-DD)
- election_type: "special" | "primary" | "general"
- is_rcv: boolean (true if NYC uses ranked-choice voting for this race)
- required_party_slug: "democrat" | "republican" | null (null for general/special elections)
- background_info: string (1-2 sentences on why this election matters)
- office_description: string | null (what this office does)

Return ONLY valid JSON — an array of election objects. No markdown, no explanation.`;

export async function POST(request: NextRequest) {
  try {
    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: PROMPT }] }],
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const raw = response.text?.trim() || "[]";

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    let elections;
    try {
      elections = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response", raw },
        { status: 500 }
      );
    }

    if (!Array.isArray(elections)) {
      elections = [elections];
    }

    return NextResponse.json({ elections });
  } catch (err) {
    console.error("Discover elections error:", err);
    return NextResponse.json(
      { error: "Failed to discover elections" },
      { status: 500 }
    );
  }
}
