"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Election, Candidate } from "@/lib/types/database";

function SortableCandidate({
  candidate,
  rank,
}: {
  candidate: Candidate;
  rank: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 rounded-xl border bg-white p-4 transition-shadow ${
        isDragging ? "shadow-lg border-primary/40 z-50" : "hover:shadow-sm"
      }`}
    >
      {/* Rank number */}
      <div
        className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
          rank <= 5
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {rank}
      </div>

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Candidate info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{candidate.name}</p>
        {candidate.party_slug && (
          <p className="text-xs text-muted-foreground capitalize">
            {candidate.party_slug}
          </p>
        )}
      </div>

      {/* Rank label */}
      {rank === 1 && (
        <Badge className="bg-amber-500/10 text-amber-600 border-0 shrink-0">
          1st Choice
        </Badge>
      )}
      {rank === 2 && (
        <Badge variant="secondary" className="shrink-0">
          2nd Choice
        </Badge>
      )}
      {rank === 3 && (
        <Badge variant="secondary" className="shrink-0">
          3rd Choice
        </Badge>
      )}
    </div>
  );
}

function UnrankedCandidate({
  candidate,
  onAdd,
}: {
  candidate: Candidate;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-dashed bg-white/50 p-4">
      <div className="shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm text-muted-foreground">
        —
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-muted-foreground">
          {candidate.name}
        </p>
        {candidate.party_slug && (
          <p className="text-xs text-muted-foreground capitalize">
            {candidate.party_slug}
          </p>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={onAdd}>
        Add to ranking
      </Button>
    </div>
  );
}

export default function RCVSimulatorPage() {
  const params = useParams();
  const router = useRouter();
  const [election, setElection] = useState<Election | null>(null);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [rankedIds, setRankedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const electionId = params.id as string;

      const [electionRes, candidatesRes] = await Promise.all([
        supabase.from("elections").select("*").eq("id", electionId).single(),
        supabase.from("candidates").select("*").eq("election_id", electionId),
      ]);

      setElection(electionRes.data);
      setAllCandidates(candidatesRes.data || []);
      setLoading(false);
    });
  }, [params.id, router]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setRankedIds((items) => {
          const oldIndex = items.indexOf(active.id as string);
          const newIndex = items.indexOf(over.id as string);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    },
    []
  );

  function addToRanking(candidateId: string) {
    if (rankedIds.length >= 5) return;
    if (rankedIds.includes(candidateId)) return;
    setRankedIds((prev) => [...prev, candidateId]);
  }

  function removeFromRanking(candidateId: string) {
    setRankedIds((prev) => prev.filter((id) => id !== candidateId));
  }

  function resetRanking() {
    setRankedIds([]);
    setShared(false);
  }

  function shareRanking() {
    const ranked = rankedIds
      .map((id, i) => {
        const c = allCandidates.find((c) => c.id === id);
        return `${i + 1}. ${c?.name}`;
      })
      .join("\n");

    const text = `My ranked-choice picks for ${election?.title}:\n${ranked}\n\nPractice your RCV ranking at VoteTrack!`;

    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center civic-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading simulator...</p>
        </div>
      </main>
    );
  }

  if (!election || !election.is_rcv) {
    return (
      <main className="flex-1 flex items-center justify-center civic-bg">
        <p className="text-muted-foreground">
          This election does not use ranked-choice voting.
        </p>
      </main>
    );
  }

  const rankedCandidates = rankedIds
    .map((id) => allCandidates.find((c) => c.id === id))
    .filter(Boolean) as Candidate[];

  const unrankedCandidates = allCandidates.filter(
    (c) => !rankedIds.includes(c.id)
  );

  return (
    <main className="flex-1 px-6 sm:px-10 lg:px-16 py-10 civic-bg">
      <div className="mx-auto max-w-2xl animate-fade-in">
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

        {/* Header */}
        <div className="mb-8">
          <Badge className="bg-primary/10 text-primary border-0 mb-3">
            RCV Simulator
          </Badge>
          <h1 className="text-3xl font-bold mb-2">
            Practice Your Ranking
          </h1>
          <p className="text-muted-foreground">
            Drag and drop to rank up to 5 candidates for the{" "}
            <span className="font-medium text-foreground">{election.title}</span>.
            Your top choice goes first.
          </p>
        </div>

        {/* How RCV works */}
        <div className="rounded-xl border bg-blue-50/50 border-blue-200/50 p-5 mb-8">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            How Ranked-Choice Voting Works
          </h3>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Rank candidates in order of preference (up to 5).</li>
            <li>If your top choice is eliminated, your vote goes to your next choice.</li>
            <li>This repeats until one candidate has over 50% of the votes.</li>
            <li>You can rank as few or as many as you like — but ranking more gives you more say.</li>
          </ol>
        </div>

        {/* Ranked list */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">
              Your Ranking {rankedIds.length > 0 && `(${rankedIds.length}/5)`}
            </h2>
            <div className="flex gap-2">
              {rankedIds.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={resetRanking}>
                    Reset
                  </Button>
                  <Button size="sm" onClick={shareRanking}>
                    {shared ? "Copied!" : "Share"}
                  </Button>
                </>
              )}
            </div>
          </div>

          {rankedIds.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed p-8 text-center text-muted-foreground">
              <p className="font-medium mb-1">No candidates ranked yet</p>
              <p className="text-sm">
                Click &quot;Add to ranking&quot; below to start, then drag to reorder.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={rankedIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {rankedCandidates.map((candidate, index) => (
                    <div key={candidate.id} className="relative group">
                      <SortableCandidate
                        candidate={candidate}
                        rank={index + 1}
                      />
                      <button
                        onClick={() => removeFromRanking(candidate.id)}
                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-destructive text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Unranked candidates */}
        {unrankedCandidates.length > 0 && (
          <div>
            <h2 className="font-semibold text-lg mb-4">
              Available Candidates ({unrankedCandidates.length})
            </h2>
            <div className="space-y-2">
              {unrankedCandidates.map((candidate) => (
                <UnrankedCandidate
                  key={candidate.id}
                  candidate={candidate}
                  onAdd={() => addToRanking(candidate.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
