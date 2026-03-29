import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

function buildPrompt(election: {
  title: string;
  office: string;
  election_date: string;
  district_type?: string | null;
  district_number?: string | null;
}) {
  return `Research the following NYC election and find all candidates running, their bios, and their policy positions.

Election: ${election.title}
Office: ${election.office}
Date: ${election.election_date}
${election.district_type ? `District: ${election.district_type} ${election.district_number || ""}` : ""}

For each candidate, find:
1. Full name
2. Party affiliation (use slug: "democrat", "republican", "independent", "green", "libertarian", "working-families")
3. Brief bio (2-3 sentences)
4. Campaign website URL
5. Their policy stances on these topics (use these exact slugs): housing, transit, safety, cost-of-living, education, sanitation, micromobility, environment, land-use, justice-reform, immigrant-rights

For each stance include:
- topic_slug: one of the slugs above
- summary: 1-2 sentence summary of their position
- full_text: longer explanation if available
- source_url: URL where this info was found
- source_name: name of the source (e.g. "NY Times", "Campaign Website")

Return ONLY valid JSON with this structure:
{
  "candidates": [
    {
      "name": "string",
      "party_slug": "string|null",
      "bio": "string|null",
      "website_url": "string|null",
      "stances": [
        {
          "topic_slug": "string",
          "summary": "string",
          "full_text": "string|null",
          "source_url": "string|null",
          "source_name": "string|null"
        }
      ]
    }
  ]
}

No markdown, no explanation — just the JSON object.`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(type: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type, ...( typeof data === "string" ? { message: data } : { data }) })}\n\n`)
        );
      }

      try {
        send("log", `Researching candidates for ${body.title}...`);

        const response = await genai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: "user", parts: [{ text: buildPrompt(body) }] }],
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        send("log", "Processing results...");

        const raw = response.text?.trim() || "{}";
        const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

        let result;
        try {
          result = JSON.parse(cleaned);
        } catch {
          send("log", "Failed to parse AI response. Raw output saved.");
          controller.close();
          return;
        }

        if (!result.candidates) {
          result = { candidates: [] };
        }

        send("log", `Found ${result.candidates.length} candidates.`);

        for (const c of result.candidates) {
          const stanceCount = c.stances?.length || 0;
          send("log", `  ${c.name} — ${stanceCount} stances`);
        }

        send("log", "Research complete.");
        send("result", result);
      } catch (err) {
        console.error("Research error:", err);
        send("log", "Research failed. Check server logs.");
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
