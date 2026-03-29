import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface Representative {
  name: string;
  office: string;
  level: "federal" | "state" | "local";
  party: string | null;
  photoUrl: string | null;
  phones: string[];
  urls: string[];
  channels: Array<{ type: string; id: string }>;
}

export async function POST(request: NextRequest) {
  const { districts, address } = await request.json();

  if (!districts || Object.keys(districts).length === 0) {
    return NextResponse.json({ error: "District info is required" }, { status: 400 });
  }

  const districtInfo = [
    districts.congressional ? `US Congressional District ${districts.congressional} (New York)` : null,
    districts.state_senate ? `NY State Senate District ${districts.state_senate}` : null,
    districts.state_assembly ? `NY State Assembly District ${districts.state_assembly}` : null,
    districts.city_council ? `NYC City Council District ${districts.city_council}` : null,
  ].filter(Boolean).join("\n- ");

  const prompt = `Find the current elected representatives for these New York districts:
- ${districtInfo}
${address ? `Address: ${address}` : ""}

Return ALL of these officials:

Federal:
- President of the United States
- Vice President of the United States
- Both US Senators from New York
- US House Representative for Congressional District ${districts.congressional || "unknown"}

State:
- Governor of New York
- Lieutenant Governor of New York
- NY Attorney General
- NY Comptroller
- NY State Senator for District ${districts.state_senate || "unknown"}
- NY State Assembly Member for District ${districts.state_assembly || "unknown"}

Local (NYC):
- Mayor of New York City
- NYC Comptroller
- NYC Public Advocate
- NYC City Council Member for District ${districts.city_council || "unknown"}
- Manhattan Borough President

For each, return:
- name: full name
- office: official title
- level: "federal", "state", or "local"
- party: "Democratic" or "Republican" or other
- website: official government or campaign website URL, or null
- phone: office phone or null

Return ONLY a valid JSON array. No markdown, no explanation.`;

  try {
    const response = await genai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const raw = response.text?.trim() || "[]";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Failed to parse response", raw }, { status: 500 });
    }

    if (!Array.isArray(parsed)) {
      parsed = [parsed];
    }

    const representatives: Representative[] = parsed.map((r: Record<string, unknown>) => ({
      name: (r.name as string) || "Unknown",
      office: (r.office as string) || "Unknown",
      level: (["federal", "state", "local"].includes(r.level as string) ? r.level : "local") as Representative["level"],
      party: (r.party as string) || null,
      photoUrl: null,
      phones: r.phone ? [r.phone as string] : [],
      urls: r.website ? [r.website as string] : [],
      channels: [],
    }));

    return NextResponse.json({ representatives });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Representatives lookup error:", message);
    return NextResponse.json(
      { error: message || "Failed to look up representatives" },
      { status: 500 }
    );
  }
}
