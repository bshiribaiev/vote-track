import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const today = new Date().toISOString().slice(0, 10);

const PROMPT = `Today is ${today}. Search the web for UPCOMING elections in New York City — only elections with dates AFTER today. Include city, state, and federal races that affect NYC voters. Do NOT include any elections that have already happened.

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
      model: "gemini-3-flash-preview",
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

    // Filter out past elections and sort nearest first
    elections = elections
      .filter((e: { election_date?: string }) => e.election_date && e.election_date >= today)
      .sort((a: { election_date: string }, b: { election_date: string }) =>
        a.election_date.localeCompare(b.election_date)
      );

    return NextResponse.json({ elections });
  } catch (err) {
    console.error("Discover elections error:", err);
    return NextResponse.json(
      { error: "Failed to discover elections" },
      { status: 500 }
    );
  }
}
