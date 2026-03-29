-- ============================================
-- NYC VoteTrack Seed Data
-- ============================================

-- Clean existing data (in reverse dependency order)
DELETE FROM public.polling_sites;
DELETE FROM public.stances;
DELETE FROM public.candidates;
DELETE FROM public.elections;

-- ============================================
-- ELECTIONS
-- ============================================

-- Manhattan CD3 Special Election
INSERT INTO public.elections (id, title, office, district_type, district_number, election_date, early_voting_start, early_voting_end, election_type, is_rcv, required_party_slug, background_info, office_description)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Manhattan CD3 Special Election',
  'City Council Member, District 3',
  'city_council',
  '3',
  '2026-04-28',
  '2026-04-18',
  '2026-04-26',
  'special',
  true,
  NULL,
  'This special election was called after Councilmember Erik Bottcher resigned to serve in the New York State Senate. District 3 covers Chelsea, Hell''s Kitchen, the West Village, Hudson Square, the Garment District, Flatiron, parts of Greenwich Village, and Times Square. The election uses ranked-choice voting — voters may rank up to 5 candidates. All candidates appear on one nonpartisan ballot.',
  'The City Council Member for District 3 represents approximately 170,000 residents in lower-to-midtown Manhattan. As one of 51 Council members, they legislate on city policy including the budget, land use and zoning (ULURP), and oversight of city agencies. The Council also confirms mayoral appointments and has subpoena power.'
);

-- NYS Democratic Primary - Governor
INSERT INTO public.elections (id, title, office, district_type, district_number, election_date, early_voting_start, early_voting_end, election_type, is_rcv, required_party_slug, background_info, office_description)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'NYS Democratic Primary — Governor',
  'Governor of New York',
  'statewide',
  NULL,
  '2026-06-23',
  '2026-06-13',
  '2026-06-21',
  'primary',
  false,
  'democrat',
  '2026 is a gubernatorial election year in New York. The Democratic primary will determine who faces the Republican nominee in November. Under a new 2025 law, governor and lieutenant governor candidates now run as a joint ticket in the primary.',
  'The Governor is the chief executive of New York State, overseeing a $230+ billion budget, appointing agency heads and judges, signing or vetoing legislation, and commanding the state National Guard. The Governor serves a four-year term with no term limits.'
);

-- NYS Republican Primary - Governor
INSERT INTO public.elections (id, title, office, district_type, district_number, election_date, early_voting_start, early_voting_end, election_type, is_rcv, required_party_slug, background_info, office_description)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'NYS Republican Primary — Governor',
  'Governor of New York',
  'statewide',
  NULL,
  '2026-06-23',
  '2026-06-13',
  '2026-06-21',
  'primary',
  false,
  'republican',
  '2026 is a gubernatorial election year in New York. The Republican primary will determine who faces the Democratic nominee in November.',
  'The Governor is the chief executive of New York State, overseeing a $230+ billion budget, appointing agency heads and judges, signing or vetoing legislation, and commanding the state National Guard. The Governor serves a four-year term with no term limits.'
);

-- NYS Democratic Primary - Attorney General
INSERT INTO public.elections (id, title, office, district_type, district_number, election_date, early_voting_start, early_voting_end, election_type, is_rcv, required_party_slug, background_info, office_description)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'NYS Democratic Primary — Attorney General',
  'Attorney General of New York',
  'statewide',
  NULL,
  '2026-06-23',
  '2026-06-13',
  '2026-06-21',
  'primary',
  false,
  'democrat',
  'The Attorney General is the state''s chief legal officer and law enforcement officer. Letitia James is the incumbent, first elected in 2018 and re-elected in 2022.',
  'The Attorney General represents New York State in legal matters, enforces consumer protection and civil rights laws, investigates fraud and corruption, and oversees charities. The AG serves a four-year term.'
);

-- NYS Democratic Primary - Comptroller
INSERT INTO public.elections (id, title, office, district_type, district_number, election_date, early_voting_start, early_voting_end, election_type, is_rcv, required_party_slug, background_info, office_description)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'NYS Democratic Primary — Comptroller',
  'State Comptroller of New York',
  'statewide',
  NULL,
  '2026-06-23',
  '2026-06-13',
  '2026-06-21',
  'primary',
  false,
  'democrat',
  'The State Comptroller is the sole trustee of the $268 billion New York State Common Retirement Fund and the state''s chief fiscal officer. Thomas DiNapoli has held the office since 2007.',
  'The Comptroller audits state and local government operations, manages the state pension fund, reviews state contracts, and reports on the state''s fiscal condition. The Comptroller serves a four-year term.'
);

-- ============================================
-- CANDIDATES — CD3 Special Election
-- ============================================

INSERT INTO public.candidates (id, election_id, name, party_slug, bio, website_url)
VALUES
(
  'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Carl Wilson',
  'democrat',
  'Former Chief of Staff to Councilmember Erik Bottcher. Founding member of the Hell''s Kitchen Democrats. His transition into politics was sparked by the 2016 presidential election. Endorsed by Council Speaker Julie Menin, City Comptroller Mark Levine, and former District 3 Council Members Corey Johnson and Christine Quinn.',
  'https://www.carlwilsonnyc.com'
),
(
  'aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Lindsey Boylan',
  'democrat',
  'Former city and state official who served as Deputy Secretary for Economic Development under Governor Cuomo. She was the first woman to publicly accuse former Governor Andrew Cuomo of sexual harassment, helping to expose his misconduct. Running on a platform of affordable housing, tenant protections, and progressive reform.',
  'https://lindseyfornyc.com'
),
(
  'aaaa3333-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Leslie Boghosian Murphy',
  'democrat',
  'Current chair of Manhattan Community Board 4, which covers Chelsea and Hell''s Kitchen. Has extensive experience in community planning and land use issues. Running on a platform focused on community-driven governance and neighborhood preservation.',
  'https://www.lesliefornyc.com'
),
(
  'aaaa4444-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Layla Law-Gisiko',
  'democrat',
  'Democratic district leader for Assembly District 75 and longtime community activist. Launched her campaign with a rally in front of NYCHA''s Fulton & Elliott-Chelsea Houses. Running on a platform of saving public housing, abolishing ICE, and fighting for tenants'' rights. Survived a ballot challenge in March 2026.',
  'https://www.laylaforny.com'
),
(
  'aaaa5555-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Jamin Enquist',
  NULL,
  'Candidate in the District 3 special election. Running on an independent platform.',
  NULL
);

-- ============================================
-- CANDIDATES — Governor Democratic Primary
-- ============================================

INSERT INTO public.candidates (id, election_id, name, party_slug, bio, website_url)
VALUES
(
  'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '22222222-2222-2222-2222-222222222222',
  'Kathy Hochul',
  'democrat',
  'Incumbent Governor of New York, first elected in 2022 after succeeding Andrew Cuomo. Previously served as Lieutenant Governor (2015–2021) and U.S. Representative for NY-26 (2011–2013). Running with Adrienne Adams, former Speaker of the New York City Council, as her lieutenant governor pick.',
  NULL
),
(
  'bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '22222222-2222-2222-2222-222222222222',
  'Jean Anglade',
  'democrat',
  'Democratic challenger for Governor in the 2026 primary.',
  NULL
);

-- ============================================
-- CANDIDATES — Governor Republican Primary
-- ============================================

INSERT INTO public.candidates (id, election_id, name, party_slug, bio, website_url)
VALUES
(
  'cccc1111-cccc-cccc-cccc-cccccccccccc',
  '33333333-3333-3333-3333-333333333333',
  'Bruce Blakeman',
  'republican',
  'Nassau County Executive. Launched his campaign for the 2026 Republican gubernatorial nomination on December 9, 2025. Running with Todd Hood, Madison County Sheriff, as his lieutenant governor pick.',
  NULL
),
(
  'cccc2222-cccc-cccc-cccc-cccccccccccc',
  '33333333-3333-3333-3333-333333333333',
  'Larry Sharpe',
  'republican',
  'Business training company founder and perennial candidate. Running with Mike Carpinelli, Lewis County Sheriff, as his lieutenant governor pick.',
  NULL
);

-- ============================================
-- STANCES — CD3 Candidates (Pre-approved)
-- ============================================

-- Carl Wilson stances
INSERT INTO public.stances (candidate_id, topic_slug, summary, full_text, source_url, source_name, status)
VALUES
('aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'housing', 'Supports expanding tenant protections and increasing affordable housing development in CD3.', 'As Chief of Staff for Erik Bottcher, Carl Wilson helped advance tenant protection policies and worked to ensure new developments included affordable units. He supports strengthening rent stabilization laws and increasing city investment in NYCHA.', 'https://www.carlwilsonnyc.com', 'Carl Wilson Campaign', 'approved'),
('aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'safety', 'Advocates for a balanced approach to public safety combining police presence with mental health response teams.', 'Wilson supports maintaining police presence while also investing in community-based safety solutions including mental health crisis response teams and violence intervention programs.', 'https://www.carlwilsonnyc.com', 'Carl Wilson Campaign', 'approved'),
('aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'transit', 'Supports expanding public transit access and improving subway safety in the district.', 'Wilson has advocated for better bus service in Hell''s Kitchen and Chelsea, improved subway station accessibility, and the continued expansion of the Second Avenue Subway.', 'https://www.carlwilsonnyc.com', 'Carl Wilson Campaign', 'approved');

-- Lindsey Boylan stances
INSERT INTO public.stances (candidate_id, topic_slug, summary, full_text, source_url, source_name, status)
VALUES
('aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'housing', 'Champions aggressive affordable housing policies and stronger tenant protections.', 'As a former urban planner and state official, Boylan supports universal rent control, major increases in public housing investment, and using city zoning tools to mandate deeply affordable units in new developments.', 'https://lindseyfornyc.com/priorities', 'Lindsey Boylan Campaign', 'approved'),
('aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'immigrant-rights', 'Strong advocate for immigrant rights and services for asylum seekers.', 'Boylan supports expanded city services for asylum seekers, legal representation programs for immigrants facing deportation, and making NYC a true sanctuary city. She opposes federal immigration enforcement cooperation.', 'https://lindseyfornyc.com/priorities', 'Lindsey Boylan Campaign', 'approved'),
('aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'justice-reform', 'Supports progressive criminal justice reform including bail reform.', 'Boylan supports maintaining and strengthening bail reform, investing in alternatives to incarceration, and ensuring the Close Rikers plan stays on track. She advocates for a public health approach to public safety.', 'https://lindseyfornyc.com/priorities', 'Lindsey Boylan Campaign', 'approved');

-- Leslie Boghosian Murphy stances
INSERT INTO public.stances (candidate_id, topic_slug, summary, full_text, source_url, source_name, status)
VALUES
('aaaa3333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'land-use', 'Expert in land use policy through CB4 leadership; advocates for community-driven development.', 'As CB4 Chair, Murphy has extensive experience with ULURP and land use decisions. She supports maintaining community input in development decisions and ensuring new construction benefits existing residents rather than displacing them.', 'https://www.lesliefornyc.com', 'Leslie Murphy Campaign', 'approved'),
('aaaa3333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'housing', 'Focuses on preserving existing affordable housing and neighborhood character.', 'Murphy supports strengthening tenant protections, preserving naturally occurring affordable housing, and ensuring community boards have meaningful input on housing developments. She opposes overdevelopment that displaces longtime residents.', 'https://www.lesliefornyc.com', 'Leslie Murphy Campaign', 'approved'),
('aaaa3333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sanitation', 'Advocates for containerized trash collection and expanded street cleaning.', 'Murphy has worked on sanitation issues as CB4 Chair and supports the city''s trash containerization program, more frequent street cleaning schedules, and expanded rat mitigation efforts in the district.', 'https://www.lesliefornyc.com', 'Leslie Murphy Campaign', 'approved');

-- Layla Law-Gisiko stances
INSERT INTO public.stances (candidate_id, topic_slug, summary, full_text, source_url, source_name, status)
VALUES
('aaaa4444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'housing', 'Champions saving NYCHA public housing and fighting for tenants'' rights.', 'Law-Gisiko launched her campaign at NYCHA''s Fulton & Elliott-Chelsea Houses, making public housing preservation a centerpiece of her platform. She opposes the demolition of public housing for private redevelopment and supports full federal and state funding for NYCHA repairs.', 'https://www.laylaforny.com', 'Layla Law-Gisiko Campaign', 'approved'),
('aaaa4444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'immigrant-rights', 'Calls for abolishing ICE and expanding sanctuary city protections.', 'Law-Gisiko has made abolishing ICE a key campaign plank and supports expanding NYC''s sanctuary city policies, providing legal services to all immigrants, and ensuring city agencies do not cooperate with federal immigration enforcement.', 'https://www.laylaforny.com', 'Layla Law-Gisiko Campaign', 'approved'),
('aaaa4444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cost-of-living', 'Fights against rising costs and utility hikes affecting district residents.', 'Law-Gisiko supports local tax relief for working families, opposing utility rate hikes, and expanding city programs that help residents with grocery and essential costs.', 'https://www.laylaforny.com', 'Layla Law-Gisiko Campaign', 'approved');

-- ============================================
-- POLLING SITES — CD3 (Representative locations)
-- ============================================

-- Early voting sites in/near District 3
INSERT INTO public.polling_sites (election_id, name, address, latitude, longitude, is_early_voting, hours)
VALUES
('11111111-1111-1111-1111-111111111111', 'Fulton Community Center', '119 9th Ave, New York, NY 10011', 40.7422, -74.0018, true, 'Sat-Sun: 9am-5pm, Mon-Fri: 8am-8pm'),
('11111111-1111-1111-1111-111111111111', 'PS 111 Adolph S. Ochs', '320 W 21st St, New York, NY 10011', 40.7444, -74.0006, true, 'Sat-Sun: 9am-5pm, Mon-Fri: 8am-8pm'),
('11111111-1111-1111-1111-111111111111', 'Holy Apostles Church', '296 9th Ave, New York, NY 10001', 40.7478, -74.0009, true, 'Sat-Sun: 9am-5pm, Mon-Fri: 8am-8pm'),
('11111111-1111-1111-1111-111111111111', 'Hartley House', '413 W 46th St, New York, NY 10036', 40.7603, -73.9920, true, 'Sat-Sun: 9am-5pm, Mon-Fri: 8am-8pm');

-- Election day sites
INSERT INTO public.polling_sites (election_id, name, address, latitude, longitude, is_early_voting, hours)
VALUES
('11111111-1111-1111-1111-111111111111', 'PS 33 Chelsea Prep', '281 9th Ave, New York, NY 10001', 40.7490, -73.9985, false, '6am-9pm'),
('11111111-1111-1111-1111-111111111111', 'Clinton Housing (aka Hell''s Kitchen)', '480 W 41st St, New York, NY 10036', 40.7580, -73.9946, false, '6am-9pm'),
('11111111-1111-1111-1111-111111111111', 'PS 212 Midtown West', '328 W 48th St, New York, NY 10036', 40.7610, -73.9885, false, '6am-9pm'),
('11111111-1111-1111-1111-111111111111', 'Hudson Guild', '441 W 26th St, New York, NY 10001', 40.7489, -74.0015, false, '6am-9pm'),
('11111111-1111-1111-1111-111111111111', 'Church of the Holy Cross', '329 W 42nd St, New York, NY 10036', 40.7580, -73.9912, false, '6am-9pm'),
('11111111-1111-1111-1111-111111111111', 'PS 3 John Melser Charrette School', '490 Hudson St, New York, NY 10014', 40.7320, -74.0065, false, '6am-9pm');
