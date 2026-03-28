# NYC VoteTrack - Product Specification (v2.1)

**Objective:** A personalized, location-aware election portal that uses Gemini to bridge the gap between complex political data and voter interests.

---

## 1. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router), Tailwind CSS, shadcn/ui |
| Database | Supabase (PostgreSQL), JSONB for district mapping |
| Auth | Supabase Auth (email sign-in) |
| AI - Chatbot | Gemini 3 Flash Preview (`gemini-3-flash-preview`) |
| AI - Admin Tagging | Gemini 3.1 Pro Preview (`gemini-3.1-pro-preview`) |
| Maps | Google Maps JS API (polling site pins) |
| Geocoding | Google Places API (address autocomplete) |
| District Lookup | Google Civic Information API |
| GCP Project | `cfa-gemini` (Project #1059037308386) |

---

## 2. Core User Experience

### A. Auth & Onboarding
- **Email Auth:** Supabase email sign-in (magic link or password).
- **Address Input:** Google Places Autocomplete for validated NYC addresses.
- **District Mapping:** Google Civic Information API resolves address to City Council, State Assembly, Congressional districts. Stored as JSONB in `profiles.district_map`.
- **Party Affiliation:** User selects party (Democrat, Republican, Independent, etc.). Determines primary eligibility.
- **Interest Picker:** User selects interest slugs (e.g., `housing`, `transit`, `safety`, `education`, `environment`, `healthcare`). Drives alignment badging.

### B. Personalized Ballot Feed
- **"My Ballot" Tab:** Only elections the user is eligible for (based on district + party for primaries).
- **"Discover" Tab:** All upcoming NYC elections. Shows "Ineligible" badge if outside user's district or wrong party for a primary.
- **Election Context Cards:** Each election shows:
  - Office name and power description
  - Election date, type (Special/Primary/General), RCV status
  - "Why this matters" AI-generated context
  - "Add to Calendar" buttons for Early Voting window + Election Day

### C. Candidate Profiles & Alignment
- **Alignment Badging:**
  - **Green tags:** Topics matching user's selected interests (sorted first)
  - **Grey tags:** Other topics the candidate has stances on
- **Stance Timeline:** Policy positions in reverse-chronological order. Changed positions show history with most recent highlighted.
- **RCV Simulator:** Drag-and-drop interface to practice ranking candidates 1-5 for the April 28 Special Election. Visual feedback on ranking. Shareable results.

### D. Proactive Chatbot (Gemini 3 Flash)
- **Floating chat bubble** on all pages.
- **Interest-injected context:** Knows user's selected interests. Suggests relevant questions when viewing a candidate (e.g., "Ask me how [Name] plans to fix the G Train").
- **Page-level RAG:** Processes candidate bio + approved stances on-the-fly. Answers cite specific sources.
- **Guardrails:** Only answers questions about NYC elections and candidates in the database. Declines partisan opinions.

---

## 3. Admin Features

### A. Admin Access
- Admin is determined by `profiles.is_admin` boolean. No separate auth flow.
- Admin-only routes protected by middleware check.

### B. Tagging Engine
- **Source Input:** Admin pastes URLs from trusted news sources (The City, Gothamist, NYT, etc.).
- **Gemini Processing:** `gemini-3.1-pro-preview` extracts stance, maps to `topic_slug`, generates summary.
- **Approval Workflow:** "Diff View" comparing new stance vs. existing. Admin clicks "Approve" to push live or "Reject" to discard.

---

## 4. Database Schema

```sql
-- Profiles (extends Supabase auth.users)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  address TEXT,
  party_slug TEXT,  -- 'dem', 'rep', 'ind', 'grn', 'lib', 'wfp'
  interest_slugs TEXT[],
  district_map JSONB,  -- {"city_council": "3", "state_assembly": "66", "congressional": "12", ...}
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Elections
elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  office TEXT NOT NULL,
  district_type TEXT,  -- 'city_council', 'state_assembly', 'congressional', 'statewide'
  district_number TEXT,
  election_date DATE NOT NULL,
  early_voting_start DATE,
  early_voting_end DATE,
  election_type TEXT NOT NULL,  -- 'special', 'primary', 'general'
  is_rcv BOOLEAN DEFAULT FALSE,
  required_party_slug TEXT,  -- NULL for general/special, 'dem'/'rep' for primaries
  background_info TEXT,
  office_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Candidates
candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID REFERENCES elections(id),
  name TEXT NOT NULL,
  party_slug TEXT,
  bio TEXT,
  photo_url TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Stances
stances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  topic_slug TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_text TEXT,
  source_url TEXT,
  source_name TEXT,
  status TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id)
)

-- Polling Sites
polling_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID REFERENCES elections(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_early_voting BOOLEAN DEFAULT FALSE,
  hours TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

---

## 5. Pre-Populated Data

### April 28 Special Election (Manhattan CD3)
- Full candidate list with bios
- RCV rules and instructions
- Early voting sites and dates
- Known candidate stances

### June 23 State Primaries
- Statewide races (Governor, AG)
- Legislative races
- Party eligibility rules

### Polling Sites
- Real 2026 NYC polling locations
- Early voting sites with dates/hours

---

## 6. Interest Slugs (Standard Set)

| Slug | Display Name | Examples |
|------|-------------|----------|
| `housing` | Affordable Housing | Rent control, NYCHA funding, new developments |
| `transit` | Public Transit | Subway safety, bus frequency, 2nd Ave Subway extension |
| `safety` | Public Safety | Policing levels, mental health response teams, retail theft |
| `cost-of-living` | Cost of Living | Grocery prices, utility hikes, local tax relief |
| `education` | Education | Class sizes, charter school caps, universal 3K/Pre-K |
| `sanitation` | Sanitation & Rats | Trash containerization, street cleaning frequency |
| `micromobility` | Micro-mobility | Bike lane expansion, e-bike charging safety |
| `environment` | Environment & Parks | Climate resiliency (flood protection), green space maintenance |
| `land-use` | Land Use (ULURP) | Zoning changes, "Member Deference" in development |
| `justice-reform` | Justice Reform | Bail laws, "Close Rikers" implementation |
| `immigrant-rights` | Immigrant Rights | Asylum seeker services, work authorization advocacy |
