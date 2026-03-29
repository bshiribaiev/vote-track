# NYC VoteTrack - Task List

Each task ends with a **build + manual test checkpoint**. Nothing gets committed until you (Daniel) confirm the feature works.

---

## Phase 1: Project Setup & Database
### Task 1.1 - Initialize Next.js + Supabase + shadcn ✅
- [x] Create Next.js app (App Router, TypeScript, Tailwind)
- [x] Install and configure shadcn/ui
- [x] Install Supabase client (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Set up environment variables (`.env.local`)
- [x] Create basic layout with shadcn components
- **Commit:** `f546413`

### Task 1.2 - Database Schema ✅
- [x] Create Supabase migration with all tables (profiles, elections, candidates, stances, polling_sites)
- [x] Set up Row Level Security (RLS) policies
- [x] Create database types from Supabase schema
- **Commit:** `20f2b4f`

---

## Phase 2: Auth & Onboarding
### Task 2.1 - Supabase Email Auth ✅
- [x] Sign up page (email + password)
- [x] Sign in page
- [x] Auth middleware for protected routes
- [x] Auto-create profile row on sign-up (trigger or client-side)
- **Commit:** `20f2b4f`

### Task 2.2 - Onboarding Flow (Address + Party + Interests) ✅
- [x] Multi-step onboarding form (post-signup redirect)
- [x] Google Places Autocomplete for address input
- [x] District lookup via Google Geocoding + US Census APIs
- [x] Party affiliation selector
- [x] Interest slug picker (multi-select chips)
- [x] Save all to `profiles` table
- **Commit:** `422e26e`

---

## Phase 3: Election Data & Ballot Feed
### Task 3.1 - Seed Real Election Data ✅
- [x] Research and seed Manhattan CD3 Special Election (April 28) — 5 candidates
- [x] Research and seed June 23 Primary races (Governor, AG, Comptroller)
- [x] Seed real polling site locations with coordinates (10 sites)
- [x] Create re-runnable seed script (`supabase/seed.sql`)
- **Test:** Run seed in Supabase SQL Editor, verify data in tables

### Task 3.2 - Ballot Feed UI ✅
- [x] "My Ballot" tab - filtered by user's districts + party
- [x] "Discover" tab - all elections with ineligibility warnings
- [x] Election context cards (office, date, type, RCV badge)
- [x] "Add to Calendar" buttons (Google Calendar integration)
- [x] Election detail page with candidates, polling sites, Google Maps links
- [x] Settings page with profile summary
- **Commit:** `a14e20f`

---

## Phase 4: Candidate Profiles & Alignment
### Task 4.1 - Candidate Profile Page ✅
- [x] Candidate detail page (`/candidates/[id]`)
- [x] Bio section with avatar initials placeholder
- [x] Alignment badges (green for user's interests, grey for others)
- [x] Stance timeline (reverse-chronological, interest matches first)
- **Commit:** `d32e321`

### Task 4.2 - RCV Simulator ✅
- [x] Drag-and-drop ranking interface (1-5) using dnd-kit
- [x] Visual feedback (numbered positions, candidate cards, rank badges)
- [x] "Reset" and "Share" functionality
- [x] Educational info box explaining RCV
- [x] RCV link on election detail page (not candidate page)

---

## Phase 5: AI Chatbot
### Task 5.1 - Gemini Chat with Session History ✅
- [x] API route for Gemini 3 Flash Preview with streaming + Google Search grounding
- [x] Floating chat bubble with smooth open/close animations
- [x] Expandable panel (45vw default, full screen maximized) with session sidebar
- [x] Chat sessions + messages persisted in Supabase
- [x] Session history sidebar (resizable, deletable, persistent state)
- [x] Interest-injected system prompt + page context injection
- [x] AI-generated follow-up questions after each turn (cached in DB)
- [x] Suggested question chips on candidate/election pages
- [x] Markdown rendering with GFM tables, raw HTML, linked sources
- [x] Thinking dots animation (. .. ...)
- [x] Guardrails: no opinions, cite sources, stay relevant

---

## Phase 6: Admin Panel
### Task 6.1 - Admin CRUD Dashboard
- [ ] Admin route (`/admin`) gated by `is_admin` on profile
- [ ] **Elections tab:** list, create, edit, delete elections
- [ ] **Candidates tab:** list, create, edit, delete candidates (scoped to election)
- [ ] **Polling Sites tab:** list, create, edit, delete sites (scoped to election)
- [ ] **Stances tab:** list all stances, approve/reject pending, edit, delete
- [ ] Full form-based editing for all fields
- **Test:** Set your user as admin. Create a new election, add a candidate, add a stance, approve it. Verify it shows on the public site
- **Commit checkpoint**

---

## Phase 7: Candidate Comparison View
### Task 7.1 - Side-by-Side Comparison
- [ ] Comparison page (`/elections/[id]/compare`)
- [ ] Select 2-3 candidates to compare
- [ ] Side-by-side view of stances grouped by topic
- [ ] Highlight matches/differences with user's interests
- [ ] Link from election detail page
- **Test:** Select 2 CD3 candidates, compare their stances on housing and transit side by side
- **Commit checkpoint**

---

## Phase 8: AI Agent Pipeline
### Task 8.1 - Election Discovery Agent
- [ ] Admin clicks "Discover Elections" button in admin panel
- [ ] API route calls Gemini 3.1 Pro with Google Search grounding
- [ ] Searches for upcoming NYC elections (city, state, federal affecting NYC voters)
- [ ] Returns structured election data (title, office, date, district, type, RCV)
- [ ] Results appear in a review queue — admin can approve/reject each
- [ ] Approved elections are created in the database
- **Test:** Click discover, verify real upcoming elections appear, approve one, verify it shows in ballot feed
- **Commit checkpoint**

### Task 8.2 - Election Research Agent
- [ ] Auto-triggers when admin approves a discovered election
- [ ] Gemini researches candidates, bios, stances, polling sites for that election
- [ ] Creates all records as pending for admin review
- [ ] "Refresh" button on existing elections to update data
- [ ] Admin reviews full batch — edit any field, approve/reject all
- [ ] Streaming UI showing agent research progress
- **Test:** Approve a discovered election, watch agent populate candidates and stances, review and approve batch
- **Commit checkpoint**

### Task 8.3 - AI Stance Research
- [ ] Admin enters a prompt (e.g., "What is Lindsey Boylan's position on transit?")
- [ ] Gemini 3.1 Pro with Google Search grounding researches and returns structured stance
- [ ] Admin reviews, edits, approves → creates approved stance in DB
- **Test:** Research a stance, verify sources, approve it, see it on candidate profile
- **Commit checkpoint**

---

## Phase 9: Email & SMS Alerts
### Task 9.1 - Election Alerts
- [ ] User opt-in for alerts in settings (email and/or SMS)
- [ ] Email alerts: early voting starts, election day reminder, new candidate stances
- [ ] SMS alerts: election day reminder, early voting reminder
- [ ] Admin trigger to send alerts for specific elections
- **Test:** Opt in for alerts, trigger an alert, verify email/SMS received
- **Commit checkpoint**

