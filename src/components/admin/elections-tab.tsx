"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import type { Election, ElectionType } from "@/lib/types/database";

const EMPTY_ELECTION = {
  title: "",
  office: "",
  district_type: "" as string,
  district_number: "",
  election_date: "",
  early_voting_start: "",
  early_voting_end: "",
  election_type: "special" as ElectionType,
  is_rcv: false,
  required_party_slug: "",
  background_info: "",
  office_description: "",
};

type ElectionForm = typeof EMPTY_ELECTION;

interface DiscoveredElection {
  title: string;
  office: string;
  district_type: string | null;
  district_number: string | null;
  election_date: string;
  early_voting_start?: string | null;
  early_voting_end?: string | null;
  election_type: string;
  is_rcv: boolean;
  required_party_slug?: string | null;
  background_info?: string | null;
  office_description?: string | null;
}

interface ResearchResult {
  candidates: Array<{
    name: string;
    party_slug: string | null;
    bio: string | null;
    website_url: string | null;
    stances: Array<{
      topic_slug: string;
      summary: string;
      full_text: string | null;
      source_url: string | null;
      source_name: string | null;
    }>;
  }>;
}

export function ElectionsTab({
  elections,
  onRefresh,
}: {
  elections: Election[];
  onRefresh: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ElectionForm>(EMPTY_ELECTION);
  const [saving, setSaving] = useState(false);

  // Sort state: "asc" = nearest first, "desc" = furthest first
  const [electionSort, setElectionSort] = useState<"asc" | "desc">("asc");
  const [discoverSort, setDiscoverSort] = useState<"asc" | "desc">("asc");

  // Discovery state
  const [discovering, setDiscovering] = useState(false);
  const [discovered, setDiscovered] = useState<DiscoveredElection[]>([]);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [approving, setApproving] = useState<Set<number>>(new Set());

  // Research state
  const [researchOpen, setResearchOpen] = useState(false);
  const [researching, setResearching] = useState(false);
  const [researchElection, setResearchElection] = useState<Election | null>(null);
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [researchLog, setResearchLog] = useState<string[]>([]);
  const [approvingResearch, setApprovingResearch] = useState(false);

  // CRUD
  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_ELECTION);
    setDialogOpen(true);
  }

  function openEdit(e: Election) {
    setEditingId(e.id);
    setForm({
      title: e.title,
      office: e.office,
      district_type: e.district_type || "",
      district_number: e.district_number || "",
      election_date: e.election_date,
      early_voting_start: e.early_voting_start || "",
      early_voting_end: e.early_voting_end || "",
      election_type: e.election_type,
      is_rcv: e.is_rcv,
      required_party_slug: e.required_party_slug || "",
      background_info: e.background_info || "",
      office_description: e.office_description || "",
    });
    setDialogOpen(true);
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: form.title,
      office: form.office,
      district_type: form.district_type || null,
      district_number: form.district_number || null,
      election_date: form.election_date,
      early_voting_start: form.early_voting_start || null,
      early_voting_end: form.early_voting_end || null,
      election_type: form.election_type,
      is_rcv: form.is_rcv,
      required_party_slug: form.required_party_slug || null,
      background_info: form.background_info || null,
      office_description: form.office_description || null,
    };

    if (editingId) {
      await supabase.from("elections").update(payload).eq("id", editingId);
    } else {
      await supabase.from("elections").insert(payload);
    }

    setSaving(false);
    setDialogOpen(false);
    onRefresh();
  }

  async function deleteElection(id: string) {
    if (!confirm("Delete this election and all its candidates, stances, and polling sites?")) return;
    const supabase = createClient();
    await supabase.from("elections").delete().eq("id", id);
    onRefresh();
  }

  // Discovery (with 1-hour localStorage cache)
  async function discoverElections() {
    const CACHE_KEY = "discovered_elections";
    const CACHE_TTL = 60 * 60 * 1000; // 1 hour

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL && Array.isArray(data)) {
          setDiscovered(data);
          setDiscoverOpen(true);
          return;
        }
      } catch { /* ignore bad cache */ }
    }

    setDiscovering(true);
    setDiscovered([]);
    setDiscoverOpen(true);

    try {
      const res = await fetch("/api/admin/discover-elections", { method: "POST" });
      const data = await res.json();
      if (data.elections) {
        setDiscovered(data.elections);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: data.elections, ts: Date.now() }));
      }
    } catch (err) {
      console.error("Discovery failed:", err);
    }
    setDiscovering(false);
  }

  async function approveDiscovered(idx: number) {
    const e = discovered[idx];
    setApproving((prev) => new Set(prev).add(idx));
    const supabase = createClient();
    await supabase.from("elections").insert({
      title: e.title,
      office: e.office,
      district_type: e.district_type || null,
      district_number: e.district_number || null,
      election_date: e.election_date,
      early_voting_start: e.early_voting_start || null,
      early_voting_end: e.early_voting_end || null,
      election_type: e.election_type || "general",
      is_rcv: e.is_rcv ?? false,
      required_party_slug: e.required_party_slug || null,
      background_info: e.background_info || null,
      office_description: e.office_description || null,
    });
    setDiscovered((prev) => prev.filter((_, i) => i !== idx));
    setApproving((prev) => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
    onRefresh();
  }

  // Research (with 1-hour localStorage cache per election)
  async function startResearch(election: Election) {
    setResearchElection(election);
    setResearchResult(null);
    setResearchLog([]);
    setResearchOpen(true);

    const CACHE_KEY = `research_${election.id}`;
    const CACHE_TTL = 60 * 60 * 1000;

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL && data) {
          setResearchLog(["Loaded from cache."]);
          setResearchResult(data);
          return;
        }
      } catch { /* ignore */ }
    }

    setResearching(true);

    try {
      const res = await fetch("/api/admin/research-election", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          electionId: election.id,
          title: election.title,
          office: election.office,
          election_date: election.election_date,
          district_type: election.district_type,
          district_number: election.district_number,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "log") {
              setResearchLog((prev) => [...prev, evt.message]);
            } else if (evt.type === "result") {
              setResearchResult(evt.data);
              localStorage.setItem(CACHE_KEY, JSON.stringify({ data: evt.data, ts: Date.now() }));
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      console.error("Research failed:", err);
      setResearchLog((prev) => [...prev, "Research failed."]);
    }
    setResearching(false);
  }

  async function approveResearch() {
    if (!researchElection || !researchResult) return;
    setApprovingResearch(true);
    const supabase = createClient();

    for (const c of researchResult.candidates) {
      const { data: inserted } = await supabase
        .from("candidates")
        .insert({
          election_id: researchElection.id,
          name: c.name,
          party_slug: c.party_slug || null,
          bio: c.bio || null,
          website_url: c.website_url || null,
        })
        .select("id")
        .single();

      if (inserted && c.stances) {
        for (const s of c.stances) {
          await supabase.from("stances").insert({
            candidate_id: inserted.id,
            topic_slug: s.topic_slug,
            summary: s.summary,
            full_text: s.full_text || null,
            source_url: s.source_url || null,
            source_name: s.source_name || null,
            status: "pending",
          });
        }
      }
    }

    setApprovingResearch(false);
    setResearchOpen(false);
    onRefresh();
  }

  function fmtDate(dateStr: string) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  }

  const sortedElections = [...elections].sort((a, b) =>
    electionSort === "asc"
      ? a.election_date.localeCompare(b.election_date)
      : b.election_date.localeCompare(a.election_date)
  );

  const sortedDiscovered = [...discovered].sort((a, b) =>
    discoverSort === "asc"
      ? a.election_date.localeCompare(b.election_date)
      : b.election_date.localeCompare(a.election_date)
  );

  const sortArrow = (dir: "asc" | "desc") => dir === "asc" ? " ↑" : " ↓";

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{elections.length} elections</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={discoverElections} disabled={discovering}>
            {discovering ? "Searching..." : "Discover Elections"}
          </Button>
          <Button onClick={openCreate}>+ New Election</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-foreground"
                onClick={() => setElectionSort((s) => s === "asc" ? "desc" : "asc")}
              >
                Date{sortArrow(electionSort)}
              </TableHead>
              <TableHead>District</TableHead>
              <TableHead className="w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedElections.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {e.election_type}
                    {e.is_rcv ? " (RCV)" : ""}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">{fmtDate(e.election_date)}</TableCell>
                <TableCell>
                  {e.district_type
                    ? `${e.district_type.replace(/_/g, " ")} ${e.district_number || ""}`
                    : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startResearch(e)}>
                      Research
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(e)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteElection(e.id)}
                    >
                      Del
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {elections.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No elections yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* CRUD Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:!max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Election" : "New Election"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Manhattan CD3 Special Election"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Office *</Label>
                <Input
                  value={form.office}
                  onChange={(e) => setForm({ ...form, office: e.target.value })}
                  placeholder="e.g. City Council Member"
                />
              </div>
              <div className="grid gap-2">
                <Label>Election Type *</Label>
                <Select
                  value={form.election_type}
                  onValueChange={(v) => v !== null && setForm({ ...form, election_type: v as ElectionType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="special">Special</SelectItem>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>District Type</Label>
                <Select
                  value={form.district_type}
                  onValueChange={(v) => v !== null && setForm({ ...form, district_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="city_council">City Council</SelectItem>
                    <SelectItem value="state_assembly">State Assembly</SelectItem>
                    <SelectItem value="state_senate">State Senate</SelectItem>
                    <SelectItem value="congressional">Congressional</SelectItem>
                    <SelectItem value="statewide">Statewide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>District Number</Label>
                <Input
                  value={form.district_number}
                  onChange={(e) => setForm({ ...form, district_number: e.target.value })}
                  placeholder="e.g. 3"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Election Date *</Label>
                <Input
                  type="date"
                  value={form.election_date}
                  onChange={(e) => setForm({ ...form, election_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Early Voting Start</Label>
                <Input
                  type="date"
                  value={form.early_voting_start}
                  onChange={(e) => setForm({ ...form, early_voting_start: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Early Voting End</Label>
                <Input
                  type="date"
                  value={form.early_voting_end}
                  onChange={(e) => setForm({ ...form, early_voting_end: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Required Party (for primaries)</Label>
                <Select
                  value={form.required_party_slug}
                  onValueChange={(v) => v !== null && setForm({ ...form, required_party_slug: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="democrat">Democrat</SelectItem>
                    <SelectItem value="republican">Republican</SelectItem>
                    <SelectItem value="independent">Independent</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="libertarian">Libertarian</SelectItem>
                    <SelectItem value="working-families">Working Families</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-3 pb-1">
                <Switch
                  checked={form.is_rcv}
                  onCheckedChange={(v) => setForm({ ...form, is_rcv: v })}
                />
                <Label>Ranked Choice Voting</Label>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Office Description</Label>
              <Textarea
                value={form.office_description}
                onChange={(e) => setForm({ ...form, office_description: e.target.value })}
                placeholder="What does this office do?"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Background Info</Label>
              <Textarea
                value={form.background_info}
                onChange={(e) => setForm({ ...form, background_info: e.target.value })}
                placeholder="Why this election matters..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving || !form.title || !form.office || !form.election_date}>
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discovery Dialog */}
      <Dialog open={discoverOpen} onOpenChange={setDiscoverOpen}>
        <DialogContent className="sm:!max-w-[80vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Discovered Elections</DialogTitle>
          </DialogHeader>
          {discovering ? (
            <div className="py-12 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
              <p className="text-sm text-muted-foreground">Searching for upcoming NYC elections...</p>
            </div>
          ) : discovered.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No new elections found.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{discovered.length} elections found</p>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:text-foreground"
                        onClick={() => setDiscoverSort((s) => s === "asc" ? "desc" : "asc")}
                      >
                        Date{sortArrow(discoverSort)}
                      </TableHead>
                      <TableHead>Office</TableHead>
                      <TableHead className="w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDiscovered.map((e, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <p className="font-medium">{e.title}</p>
                          {e.background_info && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[300px]">{e.background_info}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary">{e.election_type}</Badge>
                            {e.is_rcv && <Badge variant="outline" className="text-xs">RCV</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{fmtDate(e.election_date)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.office}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => approveDiscovered(idx)}
                              disabled={approving.has(idx)}
                            >
                              {approving.has(idx) ? "..." : "Approve"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDiscovered((prev) => prev.filter((_, i) => i !== idx))}
                            >
                              Dismiss
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Research Dialog */}
      <Dialog open={researchOpen} onOpenChange={setResearchOpen}>
        <DialogContent className="sm:!max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Research: {researchElection?.title}
            </DialogTitle>
          </DialogHeader>

          {/* Progress log */}
          {researchLog.length > 0 && (
            <div className="rounded-lg bg-gray-50 p-3 text-xs font-mono space-y-1 max-h-[120px] overflow-y-auto">
              {researchLog.map((msg, i) => (
                <p key={i} className="text-muted-foreground">{msg}</p>
              ))}
              {researching && (
                <p className="text-primary animate-pulse">Researching...</p>
              )}
            </div>
          )}

          {/* Results */}
          {researchResult && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found {researchResult.candidates.length} candidate{researchResult.candidates.length !== 1 ? "s" : ""}
              </p>
              {researchResult.candidates.map((c, ci) => (
                <div key={ci} className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{c.name}</h3>
                    {c.party_slug && <Badge variant="secondary">{c.party_slug}</Badge>}
                  </div>
                  {c.bio && <p className="text-sm text-muted-foreground mb-2">{c.bio}</p>}
                  {c.website_url && (
                    <a href={c.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                      {c.website_url}
                    </a>
                  )}
                  {c.stances && c.stances.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Stances ({c.stances.length})</p>
                      {c.stances.map((s, si) => (
                        <div key={si} className="rounded bg-gray-50 p-2 text-sm">
                          <Badge variant="secondary" className="mb-1 text-xs">{s.topic_slug}</Badge>
                          <p className="font-medium">{s.summary}</p>
                          {s.source_name && (
                            <p className="text-xs text-muted-foreground mt-1">Source: {s.source_name}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setResearchOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={approveResearch} disabled={approvingResearch}>
                  {approvingResearch ? "Saving..." : "Approve All"}
                </Button>
              </div>
            </div>
          )}

          {!researching && !researchResult && researchLog.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">Starting research...</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
