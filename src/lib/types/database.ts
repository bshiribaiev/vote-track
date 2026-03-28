export type PartySlugs = 'democrat' | 'republican' | 'independent' | 'green' | 'libertarian' | 'working-families';

export type InterestSlug =
  | 'housing'
  | 'transit'
  | 'safety'
  | 'cost-of-living'
  | 'education'
  | 'sanitation'
  | 'micromobility'
  | 'environment'
  | 'land-use'
  | 'justice-reform'
  | 'immigrant-rights';

export type ElectionType = 'special' | 'primary' | 'general';

export type DistrictType =
  | 'city_council'
  | 'state_assembly'
  | 'state_senate'
  | 'congressional'
  | 'statewide';

export type StanceStatus = 'pending' | 'approved' | 'rejected';

export interface DistrictMap {
  city_council?: string;
  state_assembly?: string;
  state_senate?: string;
  congressional?: string;
  [key: string]: string | undefined;
}

export interface Profile {
  id: string;
  full_name: string | null;
  address: string | null;
  party_slug: PartySlugs | null;
  interest_slugs: InterestSlug[];
  district_map: DistrictMap;
  is_admin: boolean;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Election {
  id: string;
  title: string;
  office: string;
  district_type: DistrictType | null;
  district_number: string | null;
  election_date: string;
  early_voting_start: string | null;
  early_voting_end: string | null;
  election_type: ElectionType;
  is_rcv: boolean;
  required_party_slug: string | null;
  background_info: string | null;
  office_description: string | null;
  created_at: string;
}

export interface Candidate {
  id: string;
  election_id: string;
  name: string;
  party_slug: string | null;
  bio: string | null;
  photo_url: string | null;
  website_url: string | null;
  created_at: string;
}

export interface Stance {
  id: string;
  candidate_id: string;
  topic_slug: InterestSlug;
  summary: string;
  full_text: string | null;
  source_url: string | null;
  source_name: string | null;
  status: StanceStatus;
  extracted_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

export interface PollingSite {
  id: string;
  election_id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  is_early_voting: boolean;
  hours: string | null;
  created_at: string;
}

export interface CandidateWithStances extends Candidate {
  stances: Stance[];
}

export interface ElectionWithCandidates extends Election {
  candidates: CandidateWithStances[];
}

export const INTEREST_LABELS: Record<InterestSlug, string> = {
  'housing': 'Affordable Housing',
  'transit': 'Public Transit',
  'safety': 'Public Safety',
  'cost-of-living': 'Cost of Living',
  'education': 'Education',
  'sanitation': 'Sanitation & Rats',
  'micromobility': 'Micro-mobility',
  'environment': 'Environment & Parks',
  'land-use': 'Land Use (ULURP)',
  'justice-reform': 'Justice Reform',
  'immigrant-rights': 'Immigrant Rights',
};

export const PARTY_LABELS: Record<PartySlugs, string> = {
  'democrat': 'Democrat',
  'republican': 'Republican',
  'independent': 'Independent',
  'green': 'Green',
  'libertarian': 'Libertarian',
  'working-families': 'Working Families',
};
