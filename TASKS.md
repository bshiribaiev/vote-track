# NYC VoteTrack - Task List

Each task ends with a **build + manual test checkpoint**. Nothing gets committed until you (Daniel) confirm the feature works.

---

## Phase 1: Project Setup & Database
### Task 1.1 - Initialize Next.js + Supabase + shadcn
- [ ] Create Next.js app (App Router, TypeScript, Tailwind)
- [ ] Install and configure shadcn/ui
- [ ] Install Supabase client (`@supabase/supabase-js`, `@supabase/ssr`)
- [ ] Set up environment variables (`.env.local`)
- [ ] Create basic layout with shadcn components
- **Test:** App runs on `localhost:3000`, shows a styled landing page
- **Commit checkpoint**

### Task 1.2 - Database Schema
- [ ] Create Supabase migration with all tables (profiles, elections, candidates, stances, polling_sites)
- [ ] Set up Row Level Security (RLS) policies
- [ ] Create database types from Supabase schema
- **Test:** Tables visible in Supabase dashboard, RLS policies active
- **Commit checkpoint**

---

## Phase 2: Auth & Onboarding
### Task 2.1 - Supabase Email Auth
- [ ] Sign up page (email + password)
- [ ] Sign in page
- [ ] Auth middleware for protected routes
- [ ] Auto-create profile row on sign-up (trigger or client-side)
- **Test:** Can sign up, sign in, sign out. Profile row created in DB
- **Commit checkpoint**

### Task 2.2 - Onboarding Flow (Address + Party + Interests)
- [ ] Multi-step onboarding form (post-signup redirect)
- [ ] Google Places Autocomplete for address input
- [ ] Google Civic Information API call to resolve districts
- [ ] Party affiliation selector
- [ ] Interest slug picker (multi-select chips)
- [ ] Save all to `profiles` table
- **Test:** Complete onboarding, verify `profiles` row has address, district_map, party_slug, interest_slugs
- **Commit checkpoint**

---

## Phase 3: Election Data & Ballot Feed
### Task 3.1 - Seed Real Election Data
- [ ] Research and seed Manhattan CD3 Special Election (April 28) candidates
- [ ] Research and seed June 23 Primary election races
- [ ] Seed real polling site locations with coordinates
- [ ] Create seed script that can be re-run
- **Test:** Query Supabase tables, verify real candidate names, election dates, polling sites
- **Commit checkpoint**

### Task 3.2 - Ballot Feed UI
- [ ] "My Ballot" tab - filtered by user's districts + party
- [ ] "Discover" tab - all elections with ineligibility warnings
- [ ] Election context cards (office, date, type, RCV badge)
- [ ] "Add to Calendar" buttons (Early Voting + Election Day, .ics download)
- **Test:** Toggle between tabs, verify correct filtering. Download .ics file opens in calendar app
- **Commit checkpoint**

---

## Phase 4: Candidate Profiles & Alignment
### Task 4.1 - Candidate Profile Page
- [ ] Candidate detail page (`/candidates/[id]`)
- [ ] Bio section with photo placeholder
- [ ] Alignment badges (green for user's interests, grey for others)
- [ ] Stance timeline (reverse-chronological, shows changes)
- **Test:** View candidate, verify green/grey tags match your interests. Stances ordered correctly
- **Commit checkpoint**

### Task 4.2 - RCV Simulator
- [ ] Drag-and-drop ranking interface (1-5) for RCV elections
- [ ] Visual feedback (numbered positions, candidate cards)
- [ ] "Reset" and "Share" functionality
- [ ] Educational tooltip explaining RCV
- **Test:** Drag candidates to rank 1-5, reorder works, reset clears, share generates link/text
- **Commit checkpoint**

---

## Phase 5: AI Chatbot
### Task 5.1 - Gemini Chat Integration
- [ ] API route for Gemini 3 Flash chat completions
- [ ] Floating chat bubble component (bottom-right)
- [ ] Chat UI with message history (user/assistant bubbles)
- [ ] Interest-injected system prompt
- [ ] Page context injection (current candidate/election data)
- **Test:** Open chat on candidate page, ask about a candidate's stance on your interest topics. Verify cited responses
- **Commit checkpoint**

### Task 5.2 - Proactive Prompts
- [ ] Context-aware suggested questions based on current page + user interests
- [ ] Suggested question chips above chat input
- [ ] Guardrails: decline off-topic or partisan opinion questions
- **Test:** Navigate to candidate page, see relevant suggested questions. Try asking off-topic question, verify refusal
- **Commit checkpoint**

---

## Phase 6: Admin Panel
### Task 6.1 - Admin Dashboard
- [ ] Admin route (`/admin`) protected by `is_admin` check
- [ ] List of pending stances for review
- [ ] Stance detail with diff view (old vs. new)
- [ ] Approve/Reject buttons
- **Test:** Set your user as admin in DB. View pending stances, approve one, verify it appears on candidate profile
- **Commit checkpoint**

### Task 6.2 - AI Tagging Engine
- [ ] Admin form to paste article URL
- [ ] API route calling Gemini 3.1 Pro to extract stances
- [ ] Parse response into stance records (topic_slug, summary, full_text)
- [ ] Auto-create pending stance entries
- **Test:** Paste a real news article URL about a CD3 candidate. Verify extracted stances appear in pending review
- **Commit checkpoint**

---

## Phase 7: Polling Sites Map
### Task 7.1 - Google Maps Integration
- [ ] Polling sites map page (`/polling-sites`)
- [ ] Google Maps JS API with site pins
- [ ] Filter by election and early voting vs. Election Day
- [ ] Pin click shows site details (name, address, hours)
- **Test:** View map, see pins for polling sites. Click pin, verify info popup. Filter works
- **Commit checkpoint**

---

## Phase 8: Polish & Integration
### Task 8.1 - End-to-End Flow Polish
- [ ] Navigation bar with all sections
- [ ] Loading states and error handling
- [ ] Mobile responsive layout
- [ ] Empty states for no elections/candidates
- **Test:** Full walkthrough: sign up → onboard → browse elections → view candidate → use RCV → chat → check polling sites
- **Final commit checkpoint**
