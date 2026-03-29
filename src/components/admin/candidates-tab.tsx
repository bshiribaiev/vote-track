"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Election, Candidate } from "@/lib/types/database";
import { PARTY_LABELS, type PartySlugs } from "@/lib/types/database";

const EMPTY_CANDIDATE = {
  election_id: "",
  name: "",
  party_slug: "",
  bio: "",
  photo_url: "",
  website_url: "",
};

type CandidateForm = typeof EMPTY_CANDIDATE;

export function CandidatesTab({ elections }: { elections: Election[] }) {
  const [selectedElection, setSelectedElection] = useState<string>("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CandidateForm>(EMPTY_CANDIDATE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (elections.length > 0 && !selectedElection) {
      setSelectedElection(elections[0].id);
    }
  }, [elections, selectedElection]);

  useEffect(() => {
    if (!selectedElection) return;
    refresh();
  }, [selectedElection]);

  function refresh() {
    const supabase = createClient();
    supabase
      .from("candidates")
      .select("*")
      .eq("election_id", selectedElection)
      .order("name")
      .then(({ data }) => setCandidates(data || []));
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_CANDIDATE, election_id: selectedElection });
    setDialogOpen(true);
  }

  function openEdit(c: Candidate) {
    setEditingId(c.id);
    setForm({
      election_id: c.election_id,
      name: c.name,
      party_slug: c.party_slug || "",
      bio: c.bio || "",
      photo_url: c.photo_url || "",
      website_url: c.website_url || "",
    });
    setDialogOpen(true);
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      election_id: form.election_id,
      name: form.name,
      party_slug: form.party_slug || null,
      bio: form.bio || null,
      photo_url: form.photo_url || null,
      website_url: form.website_url || null,
    };

    if (editingId) {
      await supabase.from("candidates").update(payload).eq("id", editingId);
    } else {
      await supabase.from("candidates").insert(payload);
    }

    setSaving(false);
    setDialogOpen(false);
    refresh();
  }

  async function deleteCandidate(id: string) {
    if (!confirm("Delete this candidate and all their stances?")) return;
    const supabase = createClient();
    await supabase.from("candidates").delete().eq("id", id);
    refresh();
  }

  const electionLabel = elections.find((e) => e.id === selectedElection)?.title || "";

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <Select value={selectedElection} onValueChange={(v) => v && setSelectedElection(v)}>
          <SelectTrigger className="w-[350px]">
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
        <p className="text-sm text-muted-foreground ml-auto">
          {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={openCreate} disabled={!selectedElection}>
          + New Candidate
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Party</TableHead>
              <TableHead>Website</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  {c.party_slug
                    ? PARTY_LABELS[c.party_slug as PartySlugs] || c.party_slug
                    : "-"}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {c.website_url ? (
                    <a
                      href={c.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {c.website_url}
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteCandidate(c.id)}
                    >
                      Del
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {candidates.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  {selectedElection ? "No candidates for this election" : "Select an election"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Candidate" : "New Candidate"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">{electionLabel}</p>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
              />
            </div>

            <div className="grid gap-2">
              <Label>Party</Label>
              <Select
                value={form.party_slug}
                onValueChange={(v) => v !== null && setForm({ ...form, party_slug: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
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

            <div className="grid gap-2">
              <Label>Bio</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Candidate biography..."
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label>Photo URL</Label>
              <Input
                value={form.photo_url}
                onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Website URL</Label>
              <Input
                value={form.website_url}
                onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving || !form.name}>
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
