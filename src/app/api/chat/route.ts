import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Create a service-role-like client for reading public data
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function buildPageContext(pageContext: {
  type?: string;
  candidateId?: string;
  electionId?: string;
}) {
  let context = "";

  if (pageContext.candidateId) {
    const { data: candidate } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", pageContext.candidateId)
      .single();

    if (candidate) {
      const { data: stances } = await supabase
        .from("stances")
        .select("*")
        .eq("candidate_id", candidate.id)
        .eq("status", "approved");

      const { data: election } = await supabase
        .from("elections")
        .select("*")
        .eq("id", candidate.election_id)
        .single();

      context += `\n\nThe user is currently viewing candidate: ${candidate.name}`;
      context += `\nParty: ${candidate.party_slug || "N/A"}`;
      context += `\nBio: ${candidate.bio || "N/A"}`;
      context += `\nWebsite: ${candidate.website_url || "N/A"}`;
      if (election) {
        context += `\nRunning in: ${election.title} (${election.election_date})`;
        context += `\nRCV: ${election.is_rcv ? "Yes" : "No"}`;
      }
      if (stances && stances.length > 0) {
        context += `\n\nKnown stances for ${candidate.name}:`;
        for (const s of stances) {
          context += `\n- ${s.topic_slug}: ${s.summary}`;
          if (s.source_url) context += ` (Source: ${s.source_url})`;
        }
      }
    }
  } else if (pageContext.electionId) {
    const { data: election } = await supabase
      .from("elections")
      .select("*")
      .eq("id", pageContext.electionId)
      .single();

    if (election) {
      context += `\n\nThe user is viewing election: ${election.title}`;
      context += `\nOffice: ${election.office}`;
      context += `\nDate: ${election.election_date}`;
      context += `\nType: ${election.election_type}`;
      context += `\nRCV: ${election.is_rcv ? "Yes" : "No"}`;
      if (election.background_info)
        context += `\nBackground: ${election.background_info}`;

      const { data: candidates } = await supabase
        .from("candidates")
        .select("*")
        .eq("election_id", election.id);

      if (candidates && candidates.length > 0) {
        context += `\n\nCandidates:`;
        for (const c of candidates) {
          context += `\n- ${c.name} (${c.party_slug || "N/A"}): ${c.bio || "No bio"}`;

          const { data: stances } = await supabase
            .from("stances")
            .select("*")
            .eq("candidate_id", c.id)
            .eq("status", "approved");

          if (stances && stances.length > 0) {
            for (const s of stances) {
              context += `\n  • ${s.topic_slug}: ${s.summary}`;
              if (s.source_url) context += ` (Source: ${s.source_url})`;
            }
          }
        }
      }
    }
  }

  return context;
}

export async function POST(request: NextRequest) {
  const { message, sessionMessages, pageContext, userProfile } =
    await request.json();

  // Build the system prompt
  let systemPrompt = `You are VoteTrack AI, a helpful and non-partisan election assistant for New York City voters.

Your guidelines:
- Provide factual, sourced information about elections, candidates, and voting
- Never express partisan opinions or recommend who to vote for
- When citing information, include the source
- Use markdown formatting for readability (bold, lists, links)
- If you don't know something, say so — don't make up information
- You can discuss any political topic, not just NYC, but keep responses relevant and informative
- When comparing candidates, present their positions side by side without bias`;

  if (userProfile) {
    systemPrompt += `\n\nUser profile:`;
    systemPrompt += `\n- Interests: ${(userProfile.interest_slugs || []).join(", ")}`;
    systemPrompt += `\n- Party: ${userProfile.party_slug || "not specified"}`;
    systemPrompt += `\n- District: City Council ${userProfile.district_map?.city_council || "unknown"}, Assembly ${userProfile.district_map?.state_assembly || "unknown"}, State Senate ${userProfile.district_map?.state_senate || "unknown"}, Congressional ${userProfile.district_map?.congressional || "unknown"}`;
  }

  if (pageContext) {
    const ctx = await buildPageContext(pageContext);
    if (ctx) {
      systemPrompt += ctx;
    }
  }

  // Build message history for Gemini
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Add prior messages from the session
  if (sessionMessages && sessionMessages.length > 0) {
    for (const msg of sessionMessages) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }

  // Add the new user message
  contents.push({
    role: "user",
    parts: [{ text: message }],
  });

  // Stream response from Gemini
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await genai.models.generateContentStream({
          model: "gemini-3-flash-preview",
          contents,
          config: {
            systemInstruction: systemPrompt,
            tools: [{ googleSearch: {} }],
          },
        });

        let sources: Array<{ title: string; url: string }> = [];
        let fullResponse = "";

        for await (const chunk of response) {
          const text = chunk.text;
          if (text) {
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "text", content: text })}\n\n`)
            );
          }

          // Collect grounding sources
          const metadata = chunk.candidates?.[0]?.groundingMetadata;
          if (metadata?.groundingChunks) {
            for (const gc of metadata.groundingChunks) {
              if (gc.web?.uri && gc.web?.title) {
                sources.push({ title: gc.web.title, url: gc.web.uri });
              }
            }
          }
        }

        // Send sources at the end
        if (sources.length > 0) {
          // Deduplicate
          const seen = new Set<string>();
          sources = sources.filter((s) => {
            if (seen.has(s.url)) return false;
            seen.add(s.url);
            return true;
          });
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "sources", sources })}\n\n`
            )
          );
        }

        // Generate follow-up questions
        try {
          const followUpRes = await genai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
              ...contents,
              { role: "model", parts: [{ text: fullResponse }] },
              {
                role: "user",
                parts: [
                  {
                    text: "Based on our conversation, suggest exactly 2 short follow-up questions the user might want to ask next. Return ONLY the questions, one per line, no numbering or bullets.",
                  },
                ],
              },
            ],
            config: { systemInstruction: systemPrompt },
          });

          const followUpText = followUpRes.text?.trim();
          if (followUpText) {
            const questions = followUpText
              .split("\n")
              .map((q) => q.trim())
              .filter((q) => q.length > 0)
              .slice(0, 2);
            if (questions.length > 0) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "followUp", questions })}\n\n`
                )
              );
            }
          }
        } catch {
          // Follow-up generation failed, not critical
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      } catch (err) {
        console.error("Gemini error:", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", content: "Sorry, I encountered an error. Please try again." })}\n\n`
          )
        );
        controller.close();
      }
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
