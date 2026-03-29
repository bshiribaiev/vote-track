# NYC VoteTrack

A personalized, location-aware election portal that uses Google Gemini to bridge the gap between complex political data and voter interests. Built for the 2026 NYC election cycle.

## Features

- **Personalized Ballot Feed** — Enter your address and we map your City Council, State Assembly, State Senate, and Congressional districts. See only the elections you're eligible to vote in, with party-based primary filtering.
- **Candidate Alignment** — Color-coded topic badges show where candidates stand on the issues you care about. Green = matches your interests.
- **Stance Timeline** — Track candidate positions over time with sourced citations from real news outlets.
- **RCV Simulator** — Drag-and-drop ranked-choice voting practice tool for the Manhattan CD3 Special Election.
- **AI Chatbot** — Gemini-powered assistant with Google Search grounding. Ask questions about any candidate or election and get sourced, non-partisan answers. Supports streaming, markdown, tables, and session history.
- **Google Calendar Integration** — One-click to add early voting and election day dates with polling locations in the description.
- **Admin Panel** — Full CRUD for elections, candidates, stances, and polling sites. AI-powered election discovery and stance research agents.

## Live Data

Pre-populated with real data for:
- **Manhattan CD3 Special Election** (April 28, 2026) — 5 candidates, RCV, polling sites
- **NYS Primary Elections** (June 23, 2026) — Governor, Attorney General, Comptroller

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), Tailwind CSS, shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email sign-in) |
| AI | Gemini 3 Flash Preview (chatbot), Gemini 3.1 Pro Preview (admin agents) |
| Search | Google Search grounding via Gemini |
| Maps | Google Places API (address autocomplete), Google Maps (polling sites) |
| Districts | Google Geocoding API + US Census Bureau geocoder |
| Drag & Drop | dnd-kit |

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project
- Google Cloud project with APIs enabled: Maps, Places, Geocoding, Civic Information, Generative Language

### Setup

1. Clone the repo:
```bash
git clone https://github.com/dchen024/hackmhc-2026.git
cd hackmhc-2026
npm install
```

2. Copy the environment template and fill in your keys:
```bash
cp .env.local.example .env.local
```

3. Run the database migrations in your Supabase SQL Editor:
   - `supabase/migrations/20260328225313_init_schema.sql`
   - `supabase/migrations/20260329031958_chat_sessions_messages.sql`
   - `supabase/migrations/20260329035902_chat_delete_policy.sql`
   - `supabase/migrations/20260329040235_chat_followup_cache.sql`

4. Seed the database with election data:
   - Run `supabase/seed.sql` in the Supabase SQL Editor

5. Start the dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Test Account Setup

1. Sign up with any email
2. Disable "Confirm email" in Supabase Auth settings for local dev
3. Use address `250 Broadway, New York, NY 10007` for the CD3 district demo
4. To test admin features, set `is_admin = true` on your profile in Supabase

## Project Structure

```
src/
  app/
    api/chat/         # Gemini streaming chat API
    api/civic/        # District lookup API
    auth/             # Sign up, login pages
    admin/            # Admin CRUD dashboard
    candidates/[id]/  # Candidate profile with alignment badges
    dashboard/        # Ballot feed (My Ballot / Discover)
    elections/[id]/   # Election detail with candidates, polling sites
    elections/[id]/rcv/ # RCV simulator
    onboarding/       # Address, party, interests setup
    settings/         # Profile settings
  components/
    chat-widget.tsx   # Floating AI chat panel
    chat-provider.tsx # Chat context provider
    navbar.tsx        # Global navigation
  lib/
    supabase/         # Supabase client, server, middleware
    types/            # TypeScript types and constants
supabase/
  migrations/         # Database schema migrations
  seed.sql            # Election seed data
```

## Team

Built at MHC Hackathon 2026.
