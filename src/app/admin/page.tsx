"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ElectionsTab } from "@/components/admin/elections-tab";
import { CandidatesTab } from "@/components/admin/candidates-tab";
import { PollingSitesTab } from "@/components/admin/polling-sites-tab";
import { StancesTab } from "@/components/admin/stances-tab";
import type { Election } from "@/lib/types/database";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [elections, setElections] = useState<Election[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        router.push("/dashboard");
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("elections")
        .select("*")
        .gte("election_date", today)
        .order("election_date", { ascending: true });

      setElections(data || []);
      setLoading(false);
    });
  }, [router]);

  function refreshElections() {
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("elections")
      .select("*")
      .gte("election_date", today)
      .order("election_date", { ascending: true })
      .then(({ data }) => setElections(data || []));
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center civic-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading admin panel...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-6 py-10 civic-bg overflow-x-hidden">
      <div className="mx-auto max-w-6xl overflow-x-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

        <Tabs defaultValue="elections">
          <TabsList className="mb-6 !h-auto p-1.5 gap-1">
            <TabsTrigger value="elections" className="px-6 py-2 text-sm font-medium">
              Elections
            </TabsTrigger>
            <TabsTrigger value="candidates" className="px-6 py-2 text-sm font-medium">
              Candidates
            </TabsTrigger>
            <TabsTrigger value="polling-sites" className="px-6 py-2 text-sm font-medium">
              Polling Sites
            </TabsTrigger>
            <TabsTrigger value="stances" className="px-6 py-2 text-sm font-medium">
              Stances
            </TabsTrigger>
          </TabsList>

          <TabsContent value="elections">
            <ElectionsTab elections={elections} onRefresh={refreshElections} />
          </TabsContent>

          <TabsContent value="candidates">
            <CandidatesTab elections={elections} />
          </TabsContent>

          <TabsContent value="polling-sites">
            <PollingSitesTab elections={elections} />
          </TabsContent>

          <TabsContent value="stances">
            <StancesTab elections={elections} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
