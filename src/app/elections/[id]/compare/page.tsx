"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  INTEREST_LABELS,
  PARTY_LABELS,
  type Election,
  type Candidate,
  type Stance,
  type Profile,
  type InterestSlug,
  type PartySlugs,
} from "@/lib/types/database";

export default function ComparePage() {
  const params = useParams();
  const router = useRouter();
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stances, setStances] = useState<Stance[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const electionId = params.id as string;
      const [profileRes, electionRes, candidatesRes, stancesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("elections").select("*").eq("id", electionId).single(),
        supabase.from("candidates").select("*").eq("election_id", electionId).order("name"),
        supabase
          .from("stances")
          .select("*"),
      ]);

      setProfile(profileRes.data);
      setElection(electionRes.data);
      setCandidates(candidatesRes.data || []);

      // Filter stances to only candidates in this election
      const candidateIds = new Set((candidatesRes.data || []).map((c: Candidate) => c.id));
      setStances((stancesRes.data || []).filter((s: Stance) => candidateIds.has(s.candidate_id)));

      // Auto-select first 2 candidates
      const ids = (candidatesRes.data || []).slice(0, 2).map((c: Candidate) => c.id);
      setSelected(ids);

      setLoading(false);
    });
  }, [params.id, router]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center civic-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading comparison...</p>
        </div>
      </main>
    );
  }

  if (!election || !profile) return null;

  const userInterests = new Set(profile.interest_slugs || []);

  function toggleCandidate(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  const selectedCandidates = candidates.filter((c) => selected.includes(c.id));

  // Collect all topics from selected candidates' stances
  const topicSet = new Set<string>();
  stances
    .filter((s) => selected.includes(s.candidate_id))
    .forEach((s) => topicSet.add(s.topic_slug));

  // Sort topics: user interests first
  const topics = [...topicSet].sort((a, b) => {
    const aMatch = userInterests.has(a as InterestSlug) ? 0 : 1;
    const bMatch = userInterests.has(b as InterestSlug) ? 0 : 1;
    return aMatch - bMatch;
  });

  function stanceFor(candidateId: string, topic: string): Stance | undefined {
    return stances.find((s) => s.candidate_id === candidateId && s.topic_slug === topic);
  }

  return (
    <main className="flex-1 px-6 sm:px-10 lg:px-16 py-10 civic-bg">
      <div className="mx-auto max-w-6xl animate-fade-in">
        {/* Back */}
        <Link
          href={`/elections/${election.id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 group"
        >
          <svg className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to {election.title}
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Compare Candidates</h1>
        <p className="text-muted-foreground mb-6">{election.title}</p>

        {/* Candidate selector */}
        <div className="rounded-xl border bg-white p-4 mb-8">
          <p className="text-sm text-muted-foreground mb-3">
            Select 2-3 candidates to compare
          </p>
          <div className="flex flex-wrap gap-2">
            {candidates.map((c) => {
              const isSelected = selected.includes(c.id);
              return (
                <Button
                  key={c.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCandidate(c.id)}
                  disabled={!isSelected && selected.length >= 3}
                >
                  {c.name}
                  {c.party_slug && (
                    <span className="ml-1 opacity-70">
                      ({(PARTY_LABELS[c.party_slug as PartySlugs] || c.party_slug).charAt(0)})
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {selectedCandidates.length < 2 ? (
          <div className="rounded-xl border bg-white p-12 text-center">
            <p className="text-muted-foreground">Select at least 2 candidates to compare.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden">
            {/* Sticky candidate header */}
            <div className="bg-white border-b">
              <div className={`grid divide-x ${
                selectedCandidates.length === 2 ? "grid-cols-2" : "grid-cols-3"
              }`}>
                {selectedCandidates.map((c) => (
                  <div key={c.id} className="px-5 py-4 flex items-center gap-3">
                    <div className="shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {c.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <Link href={`/candidates/${c.id}`} className="font-semibold text-sm hover:text-primary transition-colors truncate block">
                        {c.name}
                      </Link>
                      {c.party_slug && (
                        <p className="text-xs text-muted-foreground">
                          {PARTY_LABELS[c.party_slug as PartySlugs] || c.party_slug}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stances by topic */}
            {topics.length === 0 ? (
              <div className="p-12 text-center border-t">
                <p className="text-muted-foreground">No stances recorded for the selected candidates yet.</p>
              </div>
            ) : (
              topics.map((topic) => {
                const isUserInterest = userInterests.has(topic as InterestSlug);
                return (
                  <div key={topic}>
                    {/* Topic header */}
                    <div className={`px-5 py-2.5 border-t ${isUserInterest ? "bg-green-50/80" : "bg-gray-50"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isUserInterest ? "text-green-800" : "text-foreground"}`}>
                          {INTEREST_LABELS[topic as InterestSlug] || topic}
                        </span>
                        {isUserInterest && (
                          <Badge className="bg-green-500/15 text-green-700 border-0 text-[10px] px-1.5 py-0">
                            Your interest
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stance columns */}
                    <div className={`grid divide-x border-t ${
                      selectedCandidates.length === 2 ? "grid-cols-2" : "grid-cols-3"
                    }`}>
                      {selectedCandidates.map((c) => {
                        const stance = stanceFor(c.id, topic);
                        return (
                          <div key={c.id} className="px-5 py-4">
                            {stance ? (
                              <>
                                <p className="text-sm font-medium leading-snug mb-1.5">{stance.summary}</p>
                                {stance.full_text && (
                                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 mb-2">
                                    {stance.full_text}
                                  </p>
                                )}
                                {stance.source_url && (
                                  <a
                                    href={stance.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs text-primary hover:underline"
                                  >
                                    <svg className="w-3 h-3 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                    </svg>
                                    {stance.source_name || "Source"}
                                  </a>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center justify-center h-full min-h-[60px]">
                                <span className="text-xs text-muted-foreground/60 border border-dashed border-muted-foreground/20 rounded-md px-3 py-1.5">
                                  No stance on record
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </main>
  );
}
