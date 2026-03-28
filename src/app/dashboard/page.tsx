"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { INTEREST_LABELS, PARTY_LABELS } from "@/lib/types/database";
import type { Profile, PartySlugs, InterestSlug } from "@/lib/types/database";
import type { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile && !profile.onboarded) {
        router.push("/onboarding");
        return;
      }

      setProfile(profile);
      setLoading(false);
    });
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Signed in as {user?.email}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>

        {profile && (
          <div className="space-y-6">
            {/* Profile Summary */}
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <h2 className="font-semibold text-lg">Your Profile</h2>
              <div className="grid gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Address:</span>{" "}
                  <span className="font-medium">{profile.address}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Party:</span>{" "}
                  <span className="font-medium">
                    {profile.party_slug
                      ? PARTY_LABELS[profile.party_slug as PartySlugs]
                      : "Not set"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Districts:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(profile.district_map || {}).map(
                      ([key, value]) => (
                        <Badge key={key} variant="secondary">
                          {key.replace(/_/g, " ")}: {value}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Interests:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(profile.interest_slugs || []).map((slug: string) => (
                      <Badge key={slug} variant="default">
                        {INTEREST_LABELS[slug as InterestSlug] || slug}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Placeholder for ballot feed */}
            <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
              <p>Ballot feed coming soon.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
