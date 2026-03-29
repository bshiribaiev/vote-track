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
  type Candidate,
  type Election,
  type Stance,
  type Profile,
  type InterestSlug,
  type PartySlugs,
} from "@/lib/types/database";

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [election, setElection] = useState<Election | null>(null);
  const [stances, setStances] = useState<Stance[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const candidateId = params.id as string;

      const [profileRes, candidateRes, stancesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("candidates").select("*").eq("id", candidateId).single(),
        supabase
          .from("stances")
          .select("*")
          .eq("candidate_id", candidateId)
          .eq("status", "approved")
          .order("extracted_at", { ascending: false }),
      ]);

      setProfile(profileRes.data);
      setCandidate(candidateRes.data);
      setStances(stancesRes.data || []);

      if (candidateRes.data?.election_id) {
        const { data: electionData } = await supabase
          .from("elections")
          .select("*")
          .eq("id", candidateRes.data.election_id)
          .single();
        setElection(electionData);
      }

      setLoading(false);
    });
  }, [params.id, router]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading candidate...</p>
      </main>
    );
  }

  if (!candidate || !profile) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Candidate not found.</p>
      </main>
    );
  }

  const userInterests = new Set(profile.interest_slugs || []);
  const stanceTopics = stances.map((s) => s.topic_slug);
  const matchedTopics = stanceTopics.filter((t) => userInterests.has(t));
  const otherTopics = stanceTopics.filter((t) => !userInterests.has(t));

  // Sort stances: matched interests first
  const sortedStances = [
    ...stances.filter((s) => userInterests.has(s.topic_slug)),
    ...stances.filter((s) => !userInterests.has(s.topic_slug)),
  ];

  const alignmentScore = stanceTopics.length > 0
    ? Math.round((matchedTopics.length / stanceTopics.length) * 100)
    : 0;

  return (
    <main className="flex-1 px-6 sm:px-10 lg:px-16 py-10 bg-gray-50/50">
      <div className="mx-auto max-w-4xl">
        {/* Back */}
        {election && (
          <Link
            href={`/elections/${election.id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            ← Back to {election.title}
          </Link>
        )}

        {/* Header */}
        <div className="rounded-2xl border bg-white p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar placeholder */}
            <div className="shrink-0 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {candidate.name.split(" ").map((n) => n[0]).join("")}
              </span>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">{candidate.name}</h1>
              <div className="flex items-center gap-2 mb-3">
                {candidate.party_slug && (
                  <Badge variant="secondary">
                    {PARTY_LABELS[candidate.party_slug as PartySlugs] || candidate.party_slug}
                  </Badge>
                )}
                {election && (
                  <span className="text-sm text-muted-foreground">
                    {election.title}
                  </span>
                )}
              </div>

              {/* Bio */}
              {candidate.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {candidate.bio}
                </p>
              )}

              {/* Website */}
              {candidate.website_url && (
                <a
                  href={candidate.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Campaign website
                </a>
              )}
            </div>
          </div>

          {/* Alignment badges */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Topic Alignment
              </h2>
              {stanceTopics.length > 0 && (
                <span className="text-sm font-medium text-primary">
                  {matchedTopics.length} of {stanceTopics.length} match your interests
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {matchedTopics.map((slug) => (
                <Badge
                  key={slug}
                  className="bg-green-500/10 text-green-700 border-green-500/20 px-3 py-1"
                >
                  {INTEREST_LABELS[slug as InterestSlug] || slug}
                </Badge>
              ))}
              {otherTopics.map((slug) => (
                <Badge
                  key={slug}
                  variant="secondary"
                  className="px-3 py-1"
                >
                  {INTEREST_LABELS[slug as InterestSlug] || slug}
                </Badge>
              ))}
              {stanceTopics.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No stances recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stance timeline */}
        {sortedStances.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Stances ({sortedStances.length})
            </h2>
            <div className="space-y-4">
              {sortedStances.map((stance) => {
                const isMatch = userInterests.has(stance.topic_slug);
                return (
                  <div
                    key={stance.id}
                    className={`rounded-xl border bg-white p-6 transition-all ${
                      isMatch ? "border-green-500/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Badge
                        className={
                          isMatch
                            ? "bg-green-500/10 text-green-700 border-green-500/20"
                            : ""
                        }
                        variant={isMatch ? "outline" : "secondary"}
                      >
                        {INTEREST_LABELS[stance.topic_slug as InterestSlug] || stance.topic_slug}
                      </Badge>
                      {isMatch && (
                        <span className="text-xs text-green-600 font-medium">
                          Matches your interests
                        </span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(stance.extracted_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h3 className="font-semibold mb-2">{stance.summary}</h3>

                    {stance.full_text && (
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
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
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                        {stance.source_name || "Source"}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RCV link if applicable */}
        {election?.is_rcv && (
          <div className="rounded-xl border bg-white p-6 text-center">
            <h3 className="font-semibold mb-2">Practice Ranked-Choice Voting</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This election uses RCV. Rank up to 5 candidates in order of preference.
            </p>
            <Link href={`/elections/${election.id}/rcv`}>
              <Button>Open RCV Simulator</Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
