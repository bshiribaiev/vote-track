# NYC VoteTrack

A personalized, AI-powered election portal that bridges the gap between complex political data and NYC voter interests. Built for the 2026 NYC election cycle at MHC Hackathon 2026.

## Inspiration

New York City elections are notoriously confusing. Between ranked-choice voting, overlapping districts, staggered primaries, and dozens of races at every level of government, most voters don't know what's on their ballot — let alone where candidates stand on issues they care about. We wanted to build something that makes civic engagement feel effortless: enter your address, tell us what you care about, and we show you everything you need to vote informed.

## What it does

**VoteTrack** is a full-stack election guide that personalizes the voting experience:

- **Personalized Ballot Feed** — Enter your address and we map your City Council, State Assembly, State Senate, and Congressional districts. See only the elections you're eligible to vote in, with party-based primary filtering.
- **Candidate Profiles & Alignment** — Color-coded topic badges show where candidates stand on the issues you care about. Green = matches your interests. Stance timelines track positions with sourced citations.
- **Side-by-Side Comparison** — Compare 2-3 candidates on a topic-by-topic grid. Your interest topics are highlighted and sorted first.
- **RCV Simulator** — Drag-and-drop ranked-choice voting practice tool. Rank up to 5 candidates with educational explainers.
- **AI Chatbot** — Gemini-powered assistant with Google Search grounding. Ask questions about any candidate or election and get sourced, non-partisan answers with streaming responses, markdown rendering, and persistent session history.
- **My Representatives** — See your current elected officials at every level (federal, state, local) based on your district, with contact info and party affiliation.
- **AI Admin Agents** — Admins can discover upcoming elections, research candidates/stances, and populate the database using Gemini with Google Search grounding — all with review-before-publish workflows.
- **Google Calendar Integration** — One-click to add early voting and election day dates with polling locations.

## How we built it

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui (Base UI), Lucide icons |
| Database | Supabase (PostgreSQL) with Row Level Security |
| Auth | Supabase Auth (email + Google OAuth) |
| AI Chat | Gemini 3 Flash Preview with streaming SSE + Google Search grounding |
| AI Agents | Gemini 3 Flash Preview with structured JSON output + Google Search grounding |
| Maps | Google Places API (address autocomplete), Google Maps (polling site links) |
| Districts | Google Geocoding API + NYC GIS API + US Census Bureau geocoder |
| Drag & Drop | dnd-kit (core + sortable) |
| Markdown | react-markdown + remark-gfm + rehype-raw |

**Architecture highlights:**
- 12 pages, 7 API routes, 48 source files
- Client-side localStorage caching for AI responses (discovery, research, representatives) to minimize API calls
- SSE streaming for real-time research progress in admin panel
- Supabase RLS policies gate admin operations by `is_admin` flag
- District lookup chains 3 APIs (NYC GIS, Google Civic, US Census) with fallbacks

## Challenges we ran into

- **District mapping is hard.** No single API covers all NYC district levels. We ended up chaining NYC's GIS API for city council, Google Civic Info for state-level, and US Census geocoder for assembly/senate/congressional — with coordinate-based fallbacks.
- **Gemini structured output.** Getting Gemini to reliably return valid JSON (not markdown-wrapped, not truncated) required careful prompt engineering and server-side cleanup (stripping code fences, fallback parsing).
- **Google Civic Representatives API.** The `representatives` endpoint returned "Method not found" despite the API being enabled. We pivoted to using Gemini with Google Search grounding to look up representatives by district numbers — more reliable and richer data.
- **shadcn/ui on Base UI.** The latest shadcn uses Base UI instead of Radix. Some components (Select, Dialog) behave differently — Select's `onValueChange` can pass `null`, Dialog has a hardcoded `sm:max-w-sm` that fights custom widths.
- **Rate limits.** Heavy use of Gemini for discovery + research + representatives + chat can exhaust quotas quickly. We added aggressive localStorage caching (1h for discovery/research, 24h for representatives) to mitigate.

## Accomplishments that we're proud of

- **The AI agent pipeline actually works.** An admin can click "Discover Elections," review real upcoming NYC elections found by Gemini, approve them, then click "Research" to auto-populate candidates and stances — all with a review workflow before anything goes public.
- **True personalization.** The ballot feed isn't just a list of elections. It filters by your exact districts and party registration, highlights candidate stances that match your interests, and the chatbot's system prompt includes your profile context.
- **The RCV simulator.** Ranked-choice voting is confusing. Being able to drag-and-drop candidates into ranked positions with visual feedback makes it tangible.
- **End-to-end in a hackathon.** Auth, onboarding, district lookup, personalized feeds, candidate profiles, comparison views, AI chat with session history, admin CRUD, AI agents, representative lookup — all wired together and functional.

## What we learned

- **Prompt engineering is the new API design.** The quality of our AI features depended entirely on how precisely we prompted Gemini — field names, valid values, output format, grounding instructions.
- **Cache everything.** AI API calls are slow (5-15s) and rate-limited. localStorage caching transformed the UX from painful to instant on repeat visits.
- **Supabase RLS is powerful.** Row Level Security let us gate admin operations at the database level without writing authorization middleware — admin checks happen in SQL policies.
- **NYC open data is fragmented.** District boundaries, election info, and representative data are spread across dozens of incompatible APIs. Unifying them into a coherent user experience was the hardest infrastructure problem.

## What's next for VoteTrack

- **Email & SMS alerts** — Opt-in reminders for early voting, election day, and new candidate stances
- **LangGraph agent orchestration** — Replace single Gemini calls with multi-step agent chains that search, verify, cross-reference, and self-correct
- **Polling site maps** — Interactive map view of nearby polling locations with walking directions
- **Voter registration check** — Integrate with NY BOE to verify registration status
- **Multi-language support** — NYC has 8 official ballot languages
- **Mobile app** — React Native companion for election day

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project
- Google Cloud project with APIs enabled: Maps, Places, Geocoding, Civic Information, Generative Language

### Setup

```bash
git clone https://github.com/dchen024/hackmhc-2026.git
cd hackmhc-2026
npm install
cp .env.local.example .env.local
# Fill in your API keys in .env.local
```

Run the database migrations in your Supabase SQL Editor, then seed:
```bash
# In Supabase SQL Editor, run in order:
# supabase/migrations/20260328225313_init_schema.sql
# supabase/migrations/20260329031958_chat_sessions_messages.sql
# supabase/migrations/20260329035902_chat_delete_policy.sql
# supabase/migrations/20260329040235_chat_followup_cache.sql
# supabase/seed.sql
```

Start the dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Test Account

1. Sign up with any email (disable "Confirm email" in Supabase Auth settings for local dev)
2. Use address **250 Broadway, New York, NY 10007** for the CD3 district demo
3. To test admin features: set `is_admin = true` on your profile in Supabase

## Team

Built at MHC Hackathon 2026.
