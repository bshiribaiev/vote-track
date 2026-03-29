"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Badge } from "@/components/ui/badge";
import type { Election, PollingSite } from "@/lib/types/database";

const EMPTY_SITE = {
  election_id: "",
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  is_early_voting: false,
  hours: "",
};

type SiteForm = typeof EMPTY_SITE;

export function PollingSitesTab({ elections }: { elections: Election[] }) {
  const [selectedElection, setSelectedElection] = useState<string>("");
  const [sites, setSites] = useState<PollingSite[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SiteForm>(EMPTY_SITE);
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
      .from("polling_sites")
      .select("*")
      .eq("election_id", selectedElection)
      .order("name")
      .then(({ data }) => setSites(data || []));
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_SITE, election_id: selectedElection });
    setDialogOpen(true);
  }

  function openEdit(s: PollingSite) {
    setEditingId(s.id);
    setForm({
      election_id: s.election_id,
      name: s.name,
      address: s.address,
      latitude: s.latitude?.toString() || "",
      longitude: s.longitude?.toString() || "",
      is_early_voting: s.is_early_voting,
      hours: s.hours || "",
    });
    setDialogOpen(true);
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      election_id: form.election_id,
      name: form.name,
      address: form.address,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      is_early_voting: form.is_early_voting,
      hours: form.hours || null,
    };

    if (editingId) {
      await supabase.from("polling_sites").update(payload).eq("id", editingId);
    } else {
      await supabase.from("polling_sites").insert(payload);
    }

    setSaving(false);
    setDialogOpen(false);
    refresh();
  }

  async function deleteSite(id: string) {
    if (!confirm("Delete this polling site?")) return;
    const supabase = createClient();
    await supabase.from("polling_sites").delete().eq("id", id);
    refresh();
  }

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
          {sites.length} site{sites.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={openCreate} disabled={!selectedElection}>
          + New Polling Site
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="max-w-[250px] truncate">{s.address}</TableCell>
                <TableCell>
                  <Badge variant={s.is_early_voting ? "default" : "secondary"}>
                    {s.is_early_voting ? "Early Voting" : "Election Day"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{s.hours || "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteSite(s.id)}
                    >
                      Del
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {sites.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {selectedElection ? "No polling sites for this election" : "Select an election"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Polling Site" : "New Polling Site"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. PS 234 — Arthur W. Cunningham School"
              />
            </div>

            <div className="grid gap-2">
              <Label>Address *</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Full street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  placeholder="40.7128"
                />
              </div>
              <div className="grid gap-2">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  placeholder="-74.0060"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Hours</Label>
              <Input
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                placeholder="e.g. 6:00 AM – 9:00 PM"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_early_voting}
                onCheckedChange={(v) => setForm({ ...form, is_early_voting: v })}
              />
              <Label>Early Voting Site</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving || !form.name || !form.address}>
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
