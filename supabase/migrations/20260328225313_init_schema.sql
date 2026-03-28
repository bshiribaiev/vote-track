-- ============================================
-- NYC VoteTrack Schema
-- ============================================

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  address text,
  party_slug text check (party_slug in ('democrat', 'republican', 'independent', 'green', 'libertarian', 'working-families')),
  interest_slugs text[] default '{}',
  district_map jsonb default '{}',
  is_admin boolean default false,
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Elections
create table public.elections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  office text not null,
  district_type text check (district_type in ('city_council', 'state_assembly', 'state_senate', 'congressional', 'statewide')),
  district_number text,
  election_date date not null,
  early_voting_start date,
  early_voting_end date,
  election_type text not null check (election_type in ('special', 'primary', 'general')),
  is_rcv boolean default false,
  required_party_slug text,
  background_info text,
  office_description text,
  created_at timestamptz default now()
);

-- Candidates
create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  name text not null,
  party_slug text,
  bio text,
  photo_url text,
  website_url text,
  created_at timestamptz default now()
);

-- Stances
create table public.stances (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  topic_slug text not null,
  summary text not null,
  full_text text,
  source_url text,
  source_name text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  extracted_at timestamptz default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id)
);

-- Polling Sites
create table public.polling_sites (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  name text not null,
  address text not null,
  latitude double precision,
  longitude double precision,
  is_early_voting boolean default false,
  hours text,
  created_at timestamptz default now()
);

-- ============================================
-- Indexes
-- ============================================
create index idx_candidates_election on public.candidates(election_id);
create index idx_stances_candidate on public.stances(candidate_id);
create index idx_stances_status on public.stances(status);
create index idx_polling_sites_election on public.polling_sites(election_id);

-- ============================================
-- Auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- Auto-update updated_at on profiles
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ============================================
-- Row Level Security
-- ============================================

-- Profiles: users can read/update their own profile
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Elections: everyone can read
alter table public.elections enable row level security;

create policy "Elections are viewable by everyone"
  on public.elections for select
  using (true);

create policy "Admins can manage elections"
  on public.elections for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Candidates: everyone can read
alter table public.candidates enable row level security;

create policy "Candidates are viewable by everyone"
  on public.candidates for select
  using (true);

create policy "Admins can manage candidates"
  on public.candidates for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Stances: everyone can read approved, admins can manage all
alter table public.stances enable row level security;

create policy "Approved stances are viewable by everyone"
  on public.stances for select
  using (
    status = 'approved'
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can manage stances"
  on public.stances for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Polling Sites: everyone can read
alter table public.polling_sites enable row level security;

create policy "Polling sites are viewable by everyone"
  on public.polling_sites for select
  using (true);

create policy "Admins can manage polling sites"
  on public.polling_sites for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
