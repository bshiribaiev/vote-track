"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useChatContext } from "@/components/chat-provider";
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
  const { setPageContext } = useChatContext();
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

      // Set chat context
      if (electionRes.data) {
        const candidateNames = (candidatesRes.data || []).map((c: Candidate) => c.name);
        setPageContext({
          type: "election",
          electionId: electionId,
          suggestedQuestions: [
            `Tell me about the ${electionRes.data.title}`,
            candidateNames.length > 1
              ? `Compare ${candidateNames[0]} and ${candidateNames[1]}`
              : undefined,
            electionRes.data.is_rcv
              ? "How does ranked-choice voting work?"
              : undefined,
          ].filter(Boolean) as string[],
        });
      }

      setLoading(false);
    });
  }, [params.id, router, setPageContext]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center civic-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading election...</p>
        </div>
      </main>
    );
  }

  if (!election) {
    return (
      <main className="flex-1 flex items-center justify-center civic-bg">
        <p className="text-muted-foreground">Election not found.</p>
      </main>
    );
  }

  const earlySites = pollingSites.filter((s) => s.is_early_voting);
  const electionDaySites = pollingSites.filter((s) => !s.is_early_voting);

  const daysUntil = Math.ceil(
    (new Date(election.election_date + "T00:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const calendarIcon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );

  const mapIcon = (
    <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );

  return (
    <main className="flex-1 px-6 sm:px-10 lg:px-16 py-10 civic-bg">
      <div className="mx-auto max-w-5xl animate-fade-in">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 group"
        >
          <svg className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to ballot
        </Link>

        {/* Hero header card */}
        <div className="rounded-2xl border bg-white p-6 sm:p-8 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
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
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">{election.title}</h1>
              <p className="text-muted-foreground">{election.office}</p>
            </div>

            {/* Countdown */}
            <div className="shrink-0 text-center rounded-xl bg-gray-50 px-4 py-3 min-w-[80px]">
              <p className={`text-2xl font-bold ${daysUntil <= 7 ? "text-destructive" : daysUntil <= 30 ? "text-amber-600" : "text-foreground"}`}>
                {daysUntil > 0 ? daysUntil : daysUntil === 0 ? "!" : "-"}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                {daysUntil > 0 ? (daysUntil === 1 ? "day left" : "days left") : daysUntil === 0 ? "Today" : "Past"}
              </p>
            </div>
          </div>

          {/* Date + early voting */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-4 border-t text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {calendarIcon}
              {new Date(election.election_date + "T00:00:00").toLocaleDateString(
                "en-US",
                { weekday: "long", month: "long", day: "numeric", year: "numeric" }
              )}
            </span>
            {election.early_voting_start && (
              <span className="text-muted-foreground">
                Early voting:{" "}
                {new Date(election.early_voting_start + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                –
                {new Date(election.early_voting_end + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>

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
                {calendarIcon}
                <span className="ml-1.5">Add Early Voting</span>
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
              {calendarIcon}
              <span className="ml-1.5">Add Election Day</span>
            </Button>
          </div>
        </div>

        {/* Context: why it matters + about the office — combined */}
        {(election.background_info || election.office_description) && (
          <div className="rounded-xl border bg-white p-6 mb-6">
            {election.background_info && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Why this matters</h2>
                <p className="text-sm leading-relaxed">
                  {election.background_info}
                </p>
              </div>
            )}
            {election.background_info && election.office_description && (
              <hr className="my-4" />
            )}
            {election.office_description && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">About this office</h2>
                <p className="text-sm leading-relaxed">
                  {election.office_description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Candidates */}
        {candidates.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">
                Candidates ({candidates.length})
              </h2>
              {candidates.length >= 2 && (
                <Link href={`/elections/${election.id}/compare`}>
                  <Button variant="outline" size="sm">Compare side-by-side</Button>
                </Link>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {candidates.map((c) => (
                <Link key={c.id} href={`/candidates/${c.id}`} className="block h-full">
                  <div className="group h-full rounded-xl border bg-white p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {c.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {c.name}
                        </h3>
                      </div>
                      {c.party_slug && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {c.party_slug.charAt(0).toUpperCase() +
                            c.party_slug.slice(1)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                      {c.bio}
                    </p>
                    <p className="text-xs text-primary mt-3 font-medium">
                      View profile →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* RCV Simulator */}
        {election.is_rcv && candidates.length > 0 && (
          <div className="rounded-xl border bg-primary/5 border-primary/20 p-6 mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Practice Ranked-Choice Voting</h3>
              <p className="text-sm text-muted-foreground">
                This election uses RCV. Practice ranking up to 5 candidates in order of preference.
              </p>
            </div>
            <Link href={`/elections/${election.id}/rcv`}>
              <Button>Open RCV Simulator</Button>
            </Link>
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
                    <div key={site.id} className="rounded-lg border bg-white p-4">
                      <p className="font-medium text-sm">{site.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{site.address}</p>
                      {site.hours && (
                        <p className="text-xs text-muted-foreground mt-1">{site.hours}</p>
                      )}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.name + ", " + site.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-primary hover:underline mt-2"
                      >
                        {mapIcon}
                        Open in Google Maps
                      </a>
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
                    <div key={site.id} className="rounded-lg border bg-white p-4">
                      <p className="font-medium text-sm">{site.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{site.address}</p>
                      {site.hours && (
                        <p className="text-xs text-muted-foreground mt-1">{site.hours}</p>
                      )}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.name + ", " + site.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-primary hover:underline mt-2"
                      >
                        {mapIcon}
                        Open in Google Maps
                      </a>
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
