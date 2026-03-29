"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PARTY_LABELS } from "@/lib/types/database";
import type { Profile, Election, Candidate, PollingSite, PartySlugs } from "@/lib/types/database";
import Link from "next/link";

function daysUntil(dateStr: string) {
  const now = new Date();
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function openGoogleCalendar(title: string, date: string, description: string) {
  const d = new Date(date + "T00:00:00");
  const dtStr = d.toISOString().replace(/[-:.]/g, "").slice(0, 8);
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", title);
  url.searchParams.set("dates", `${dtStr}/${dtStr}`);
  url.searchParams.set("details", description);
  url.searchParams.set("location", "New York, NY");
  window.open(url.toString(), "_blank");
}

function isEligible(election: Election, profile: Profile): boolean {
  // Statewide elections: everyone is eligible (party check for primaries)
  if (election.district_type === "statewide") {
    if (election.required_party_slug && profile.party_slug !== election.required_party_slug) {
      return false;
    }
    return true;
  }

  // District-based: check if user's district matches
  if (election.district_type && election.district_number) {
    const userDistrict = profile.district_map?.[election.district_type];
    if (userDistrict !== election.district_number) {
      return false;
    }
  }

  // Party check for primaries
  if (election.required_party_slug && profile.party_slug !== election.required_party_slug) {
    return false;
  }

  return true;
}

function ElectionCard({
  election,
  candidates,
  pollingSites,
  eligible,
  reason,
}: {
  election: Election;
  candidates: Candidate[];
  pollingSites: PollingSite[];
  eligible: boolean;
  reason?: string;
}) {
  const days = daysUntil(election.election_date);

  const earlySites = pollingSites.filter((s) => s.is_early_voting);
  const electionDaySites = pollingSites.filter((s) => !s.is_early_voting);

  const earlyVotingDesc = [
    `Early voting for ${election.title}`,
    election.background_info ? `\n${election.background_info}` : "",
    earlySites.length > 0 ? `\nEarly Voting Locations:\n${earlySites.map((s) => `• ${s.name} — ${s.address}${s.hours ? ` (${s.hours})` : ""}`).join("\n")}` : "",
    `\nMore info at votetrack.nyc`,
  ].filter(Boolean).join("\n");

  const electionDayDesc = [
    `Election Day for ${election.title}`,
    `Polls open 6am–9pm`,
    election.background_info ? `\n${election.background_info}` : "",
    electionDaySites.length > 0
      ? `\nPolling Locations:\n${electionDaySites.map((s) => `• ${s.name} — ${s.address}${s.hours ? ` (${s.hours})` : ""}`).join("\n")}`
      : earlySites.length > 0
      ? `\nVoting Locations:\n${earlySites.map((s) => `• ${s.name} — ${s.address}`).join("\n")}`
      : "",
    candidates.length > 0 ? `\nCandidates: ${candidates.map((c) => c.name).join(", ")}` : "",
    `\nMore info at votetrack.nyc`,
  ].filter(Boolean).join("\n");

  return (
    <Link href={`/elections/${election.id}`} className="block">
    <div
      className={`group relative rounded-2xl border p-6 transition-all duration-300 cursor-pointer ${
        eligible
          ? "bg-white border-border/60 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          : "bg-gray-50/50 border-border/40 opacity-75"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Badge
          className={
            election.election_type === "special"
              ? "bg-primary/10 text-primary border-0"
              : election.election_type === "primary"
              ? "bg-amber-500/10 text-amber-600 border-0"
              : "bg-green-500/10 text-green-600 border-0"
          }
        >
          {election.election_type.charAt(0).toUpperCase() + election.election_type.slice(1)}
        </Badge>
        {election.is_rcv && (
          <Badge variant="outline" className="border-primary/20 text-primary text-xs">
            Ranked Choice
          </Badge>
        )}
        {!eligible && (
          <Badge variant="outline" className="border-destructive/30 text-destructive text-xs">
            Ineligible
          </Badge>
        )}
        <span className="ml-auto text-xs font-medium text-muted-foreground bg-gray-100 px-2.5 py-1 rounded-full">
          {days > 0 ? `${days}d away` : days === 0 ? "Today" : "Past"}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">
        {election.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-1">{election.office}</p>

      {/* Date */}
      <div className="flex items-center text-sm text-foreground/70 mb-4">
        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        {new Date(election.election_date + "T00:00:00").toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </div>

      {/* Ineligibility reason */}
      {!eligible && reason && (
        <p className="text-xs text-muted-foreground mb-3 italic">{reason}</p>
      )}

      {/* Why this matters */}
      {election.background_info && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {election.background_info}
        </p>
      )}

      {/* Candidates preview */}
      {candidates.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {candidates.length} Candidate{candidates.length !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {candidates.map((c) => (
              <Badge
                key={c.id}
                variant="secondary"
                className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `/candidates/${c.id}`;
                }}
              >
                {c.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-border/40">
        {election.early_voting_start && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={(e) => {
              e.preventDefault();
              openGoogleCalendar(
                `Early Voting: ${election.title}`,
                election.early_voting_start!,
                earlyVotingDesc
              );
            }}
          >
            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            Add Early Voting
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={(e) => {
            e.preventDefault();
            openGoogleCalendar(
              `Election Day: ${election.title}`,
              election.election_date,
              electionDayDesc
            );
          }}
        >
          <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          Add Election Day
        </Button>
        <span className="ml-auto text-xs text-muted-foreground group-hover:text-primary transition-colors">
          View details →
        </span>
      </div>
    </div>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pollingSites, setPollingSites] = useState<PollingSite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const [profileRes, electionsRes, candidatesRes, sitesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("elections").select("*").order("election_date", { ascending: true }),
        supabase.from("candidates").select("*"),
        supabase.from("polling_sites").select("*"),
      ]);

      if (profileRes.data && !profileRes.data.onboarded) {
        router.push("/onboarding");
        return;
      }

      setProfile(profileRes.data);
      setElections(electionsRes.data || []);
      setCandidates(candidatesRes.data || []);
      setPollingSites(sitesRes.data || []);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center civic-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your ballot...</p>
        </div>
      </main>
    );
  }

  if (!profile) return null;

  const today = new Date().toISOString().slice(0, 10);
  const upcomingEligible = elections.filter((e) => isEligible(e, profile) && e.election_date >= today);
  const pastEligible = elections.filter((e) => isEligible(e, profile) && e.election_date < today);
  const discoverElections = elections.filter((e) => e.election_date >= today);

  function getIneligibilityReason(election: Election): string | undefined {
    if (election.district_type && election.district_type !== "statewide" && election.district_number) {
      const userDistrict = profile!.district_map?.[election.district_type];
      if (userDistrict !== election.district_number) {
        return `You're in ${election.district_type.replace(/_/g, " ")} district ${userDistrict || "unknown"}, not district ${election.district_number}.`;
      }
    }
    if (election.required_party_slug && profile!.party_slug !== election.required_party_slug) {
      return `Requires ${PARTY_LABELS[election.required_party_slug as PartySlugs] || election.required_party_slug} registration.`;
    }
    return undefined;
  }

  function getCandidatesForElection(electionId: string) {
    return candidates.filter((c) => c.election_id === electionId);
  }

  function getSitesForElection(electionId: string) {
    return pollingSites.filter((s) => s.election_id === electionId);
  }

  return (
    <main className="flex-1 px-6 py-10 civic-bg">
      <div className="mx-auto max-w-5xl animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Your Elections</h1>
          <p className="text-muted-foreground mt-1.5">
            Showing elections for {profile.address?.split(",")[0] || "your address"}
            {profile.party_slug && (
              <> &middot; {PARTY_LABELS[profile.party_slug as PartySlugs]}</>
            )}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="my-ballot">
          <TabsList className="mb-4 !h-auto p-1.5 gap-1">
            <TabsTrigger value="my-ballot" className="px-8 py-2 text-base font-medium">
              My Ballot ({upcomingEligible.length})
            </TabsTrigger>
            <TabsTrigger value="discover" className="px-8 py-2 text-base font-medium">
              Discover ({discoverElections.length})
            </TabsTrigger>
            {pastEligible.length > 0 && (
              <TabsTrigger value="past" className="px-8 py-2 text-base font-medium">
                Past ({pastEligible.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="my-ballot">
            {upcomingEligible.length === 0 ? (
              <div className="rounded-xl border bg-white p-12 text-center">
                <p className="text-muted-foreground">
                  No upcoming elections match your district and party registration.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check the Discover tab to see all NYC elections.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEligible.map((election) => (
                  <ElectionCard
                    key={election.id}
                    election={election}
                    candidates={getCandidatesForElection(election.id)}
                    pollingSites={getSitesForElection(election.id)}
                    eligible={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="discover">
            <div className="space-y-4">
              {discoverElections.map((election) => {
                const eligible = isEligible(election, profile);
                return (
                  <ElectionCard
                    key={election.id}
                    election={election}
                    candidates={getCandidatesForElection(election.id)}
                    pollingSites={getSitesForElection(election.id)}
                    eligible={eligible}
                    reason={!eligible ? getIneligibilityReason(election) : undefined}
                  />
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="past">
            <div className="space-y-4">
              {pastEligible.map((election) => (
                <ElectionCard
                  key={election.id}
                  election={election}
                  candidates={getCandidatesForElection(election.id)}
                  pollingSites={getSitesForElection(election.id)}
                  eligible={true}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
