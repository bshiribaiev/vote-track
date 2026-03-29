"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  INTEREST_LABELS,
  type Election,
  type Candidate,
  type Stance,
  type InterestSlug,
  type StanceStatus,
} from "@/lib/types/database";

const EMPTY_STANCE = {
  candidate_id: "",
  topic_slug: "" as string,
  summary: "",
  full_text: "",
  source_url: "",
  source_name: "",
  status: "pending" as StanceStatus,
};

type StanceForm = typeof EMPTY_STANCE;

interface StanceWithCandidate extends Stance {
  candidate_name: string;
  election_title: string;
}

interface ResearchedStance {
  topic_slug: string;
  summary: string;
  full_text: string | null;
  source_url: string | null;
  source_name: string | null;
}

export function StancesTab({ elections }: { elections: Election[] }) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [stances, setStances] = useState<StanceWithCandidate[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StanceForm>(EMPTY_STANCE);
  const [saving, setSaving] = useState(false);
  const [selectedElection, setSelectedElection] = useState<string>("");

  // AI Research state
  const [researchOpen, setResearchOpen] = useState(false);
  const [researchPrompt, setResearchPrompt] = useState("");
  const [researchElection, setResearchElection] = useState("");
  const [researchCandidate, setResearchCandidate] = useState("");
  const [researching, setResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<ResearchedStance | null>(null);
  const [approvingResearch, setApprovingResearch] = useState(false);

  useEffect(() => {
    refreshStances();
    refreshCandidates();
  }, []);

  function refreshCandidates() {
    const supabase = createClient();
    supabase
      .from("candidates")
      .select("*")
      .order("name")
      .then(({ data }) => setCandidates(data || []));
  }

  function refreshStances() {
    const supabase = createClient();
    supabase
      .from("stances")
      .select("*, candidates(name, election_id)")
      .order("extracted_at", { ascending: false })
      .then(({ data }) => {
        const mapped = (data || []).map((s: Record<string, unknown>) => {
          const candidate = s.candidates as { name: string; election_id: string } | null;
          const election = elections.find((e) => e.id === candidate?.election_id);
          return {
            ...s,
            candidate_name: candidate?.name || "Unknown",
            election_title: election?.title || "Unknown",
          } as StanceWithCandidate;
        });
        setStances(mapped);
      });
  }

  function filtered() {
    if (filter === "all") return stances;
    return stances.filter((s) => s.status === filter);
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_STANCE);
    setSelectedElection("");
    setDialogOpen(true);
  }

  function openEdit(s: StanceWithCandidate) {
    setEditingId(s.id);
    const candidate = candidates.find((c) => c.id === s.candidate_id);
    setSelectedElection(candidate?.election_id || "");
    setForm({
      candidate_id: s.candidate_id,
      topic_slug: s.topic_slug,
      summary: s.summary,
      full_text: s.full_text || "",
      source_url: s.source_url || "",
      source_name: s.source_name || "",
      status: s.status,
    });
    setDialogOpen(true);
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      candidate_id: form.candidate_id,
      topic_slug: form.topic_slug,
      summary: form.summary,
      full_text: form.full_text || null,
      source_url: form.source_url || null,
      source_name: form.source_name || null,
      status: form.status,
      approved_at: form.status === "approved" ? new Date().toISOString() : null,
      approved_by: form.status === "approved" ? user?.id || null : null,
    };

    if (editingId) {
      await supabase.from("stances").update(payload).eq("id", editingId);
    } else {
      await supabase.from("stances").insert(payload);
    }

    setSaving(false);
    setDialogOpen(false);
    refreshStances();
  }

  async function setStatus(id: string, status: StanceStatus) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("stances").update({
      status,
      approved_at: status === "approved" ? new Date().toISOString() : null,
      approved_by: status === "approved" ? user?.id || null : null,
    }).eq("id", id);
    refreshStances();
  }

  async function deleteStance(id: string) {
    if (!confirm("Delete this stance?")) return;
    const supabase = createClient();
    await supabase.from("stances").delete().eq("id", id);
    refreshStances();
  }

  const electionCandidates = selectedElection
    ? candidates.filter((c) => c.election_id === selectedElection)
    : [];

  const researchCandidates = researchElection
    ? candidates.filter((c) => c.election_id === researchElection)
    : [];

  const pendingCount = stances.filter((s) => s.status === "pending").length;

  function openResearch() {
    setResearchPrompt("");
    setResearchElection("");
    setResearchCandidate("");
    setResearchResult(null);
    setResearchOpen(true);
  }

  async function runResearch() {
    setResearching(true);
    setResearchResult(null);
    const candidateName = researchCandidates.find((c) => c.id === researchCandidate)?.name;
    try {
      const res = await fetch("/api/admin/research-stance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: researchPrompt, candidateName }),
      });
      const data = await res.json();
      if (data.stance) {
        setResearchResult(data.stance);
      }
    } catch (err) {
      console.error("Stance research failed:", err);
    }
    setResearching(false);
  }

  async function approveResearchResult() {
    if (!researchCandidate || !researchResult) return;
    setApprovingResearch(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("stances").insert({
      candidate_id: researchCandidate,
      topic_slug: researchResult.topic_slug,
      summary: researchResult.summary,
      full_text: researchResult.full_text || null,
      source_url: researchResult.source_url || null,
      source_name: researchResult.source_name || null,
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: user?.id || null,
    });
    setApprovingResearch(false);
    setResearchOpen(false);
    refreshStances();
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-1">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" && pendingCount > 0 && (
                <Badge variant="destructive" className="ml-1.5 px-1.5 py-0 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground ml-auto">
          {filtered().length} stance{filtered().length !== 1 ? "s" : ""}
        </p>
        <Button variant="outline" onClick={openResearch}>AI Research</Button>
        <Button onClick={openCreate}>+ New Stance</Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered().map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{s.candidate_name}</p>
                    <p className="text-xs text-muted-foreground">{s.election_title}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {INTEREST_LABELS[s.topic_slug as InterestSlug] || s.topic_slug}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[300px] truncate text-sm">
                  {s.summary}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      s.status === "approved"
                        ? "default"
                        : s.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {s.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {s.status !== "approved" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600"
                        onClick={() => setStatus(s.id, "approved")}
                      >
                        Approve
                      </Button>
                    )}
                    {s.status !== "rejected" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600"
                        onClick={() => setStatus(s.id, "rejected")}
                      >
                        Reject
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteStance(s.id)}
                    >
                      Del
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered().length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No {filter === "all" ? "" : filter + " "}stances
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Stance" : "New Stance"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Election</Label>
                <Select value={selectedElection} onValueChange={(v) => { if (v === null) return;
                  setSelectedElection(v);
                  setForm({ ...form, candidate_id: "" });
                }}>
                  <SelectTrigger>
                    <span className="truncate">
                      {elections.find((e) => e.id === selectedElection)?.title || "Select election..."}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {elections.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Candidate *</Label>
                <Select
                  value={form.candidate_id}
                  onValueChange={(v) => v !== null && setForm({ ...form, candidate_id: v })}
                >
                  <SelectTrigger>
                    <span className="truncate">
                      {electionCandidates.find((c) => c.id === form.candidate_id)?.name || "Select candidate..."}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {electionCandidates.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Topic *</Label>
                <Select
                  value={form.topic_slug}
                  onValueChange={(v) => v !== null && setForm({ ...form, topic_slug: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select topic..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INTEREST_LABELS).map(([slug, label]) => (
                      <SelectItem key={slug} value={slug}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => v !== null && setForm({ ...form, status: v as StanceStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Summary *</Label>
              <Textarea
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Brief stance summary..."
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Full Text</Label>
              <Textarea
                value={form.full_text}
                onChange={(e) => setForm({ ...form, full_text: e.target.value })}
                placeholder="Full stance details..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Source Name</Label>
                <Input
                  value={form.source_name}
                  onChange={(e) => setForm({ ...form, source_name: e.target.value })}
                  placeholder="e.g. NY Times Interview"
                />
              </div>
              <div className="grid gap-2">
                <Label>Source URL</Label>
                <Input
                  value={form.source_url}
                  onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={save}
                disabled={saving || !form.candidate_id || !form.topic_slug || !form.summary}
              >
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Research Dialog */}
      <Dialog open={researchOpen} onOpenChange={setResearchOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Stance Research</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Election</Label>
                <Select value={researchElection} onValueChange={(v) => { if (v === null) return;
                  setResearchElection(v);
                  setResearchCandidate("");
                }}>
                  <SelectTrigger>
                    <span className="truncate">
                      {elections.find((e) => e.id === researchElection)?.title || "Select election..."}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {elections.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Candidate *</Label>
                <Select
                  value={researchCandidate}
                  onValueChange={(v) => v !== null && setResearchCandidate(v)}
                >
                  <SelectTrigger>
                    <span className="truncate">
                      {researchCandidates.find((c) => c.id === researchCandidate)?.name || "Select candidate..."}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {researchCandidates.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Research Prompt *</Label>
              <Textarea
                value={researchPrompt}
                onChange={(e) => setResearchPrompt(e.target.value)}
                placeholder="e.g. What is Lindsey Boylan's position on transit?"
                rows={3}
              />
            </div>

            <Button
              onClick={runResearch}
              disabled={researching || !researchCandidate || !researchPrompt}
            >
              {researching ? "Researching..." : "Research"}
            </Button>

            {/* Result */}
            {researchResult && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {INTEREST_LABELS[researchResult.topic_slug as InterestSlug] || researchResult.topic_slug}
                  </Badge>
                </div>
                <p className="font-medium">{researchResult.summary}</p>
                {researchResult.full_text && (
                  <p className="text-sm text-muted-foreground">{researchResult.full_text}</p>
                )}
                {researchResult.source_url && (
                  <a
                    href={researchResult.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    {researchResult.source_name || researchResult.source_url}
                  </a>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setResearchResult(null)}>
                    Dismiss
                  </Button>
                  <Button onClick={approveResearchResult} disabled={approvingResearch}>
                    {approvingResearch ? "Saving..." : "Approve & Save"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
