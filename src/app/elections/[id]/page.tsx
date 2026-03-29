"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Election, Candidate, PollingSite } from "@/lib/types/database";

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

export default function ElectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [election, setElection] = useState<Election | null>(null);
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

      const electionId = params.id as string;

      const [electionRes, candidatesRes, sitesRes] = await Promise.all([
        supabase.from("elections").select("*").eq("id", electionId).single(),
        supabase.from("candidates").select("*").eq("election_id", electionId),
        supabase.from("polling_sites").select("*").eq("election_id", electionId),
      ]);

      setElection(electionRes.data);
      setCandidates(candidatesRes.data || []);
      setPollingSites(sitesRes.data || []);
      setLoading(false);
    });
  }, [params.id, router]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading election...</p>
      </main>
    );
  }

  if (!election) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Election not found.</p>
      </main>
    );
  }

  const earlySites = pollingSites.filter((s) => s.is_early_voting);
  const electionDaySites = pollingSites.filter((s) => !s.is_early_voting);

  return (
    <main className="flex-1 px-6 sm:px-10 lg:px-16 py-10 bg-gray-50/50">
      <div className="mx-auto max-w-5xl">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          ← Back to ballot
        </Link>

        {/* Header */}
        <div className="mb-8">
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
              {election.election_type.charAt(0).toUpperCase() +
                election.election_type.slice(1)}
            </Badge>
            {election.is_rcv && (
              <Badge
                variant="outline"
                className="border-primary/20 text-primary text-xs"
              >
                Ranked Choice
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">{election.title}</h1>
          <p className="text-lg text-muted-foreground">{election.office}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {new Date(election.election_date + "T00:00:00").toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              }
            )}
            {election.early_voting_start && (
              <>
                {" "}
                &middot; Early voting:{" "}
                {new Date(
                  election.early_voting_start + "T00:00:00"
                ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                –
                {new Date(
                  election.early_voting_end + "T00:00:00"
                ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </>
            )}
          </p>

          {/* Calendar buttons */}
          <div className="flex gap-2 mt-4">
            {election.early_voting_start && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  openGoogleCalendar(
                    `Early Voting: ${election.title}`,
                    election.early_voting_start!,
                    `Early voting for ${election.title}. Ends ${election.early_voting_end}.`
                  )
                }
              >
                Add Early Voting to Calendar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                openGoogleCalendar(
                  `Election Day: ${election.title}`,
                  election.election_date,
                  `Election Day for ${election.title}. Polls open 6am-9pm.`
                )
              }
            >
              Add Election Day to Calendar
            </Button>
          </div>
        </div>

        {/* Why this matters */}
        {election.background_info && (
          <div className="rounded-xl border bg-white p-6 mb-8">
            <h2 className="font-semibold text-lg mb-2">Why this matters</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {election.background_info}
            </p>
          </div>
        )}

        {/* Office description */}
        {election.office_description && (
          <div className="rounded-xl border bg-white p-6 mb-8">
            <h2 className="font-semibold text-lg mb-2">About this office</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {election.office_description}
            </p>
          </div>
        )}

        {/* Candidates */}
        {candidates.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold text-lg mb-4">
              Candidates ({candidates.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {candidates.map((c) => (
                <Link key={c.id} href={`/candidates/${c.id}`}>
                  <div className="group rounded-xl border bg-white p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {c.name}
                      </h3>
                      {c.party_slug && (
                        <Badge variant="secondary" className="text-xs">
                          {c.party_slug.charAt(0).toUpperCase() +
                            c.party_slug.slice(1)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {c.bio}
                    </p>
                    <p className="text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      View profile →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Polling sites */}
        {pollingSites.length > 0 && (
          <div>
            <h2 className="font-semibold text-lg mb-4">Polling Sites</h2>

            {earlySites.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Early Voting Sites
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {earlySites.map((site) => (
                    <div
                      key={site.id}
                      className="rounded-lg border bg-white p-4"
                    >
                      <p className="font-medium text-sm">{site.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {site.address}
                      </p>
                      {site.hours && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {site.hours}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {electionDaySites.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Election Day Sites
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {electionDaySites.map((site) => (
                    <div
                      key={site.id}
                      className="rounded-lg border bg-white p-4"
                    >
                      <p className="font-medium text-sm">{site.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {site.address}
                      </p>
                      {site.hours && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {site.hours}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
