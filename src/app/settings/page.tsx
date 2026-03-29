"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  INTEREST_LABELS,
  PARTY_LABELS,
  type Profile,
  type PartySlugs,
  type InterestSlug,
} from "@/lib/types/database";

interface RepSummary {
  name: string;
  office: string;
  level: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reps, setReps] = useState<RepSummary[]>([]);
  const [repsLoading, setRepsLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data);
      setLoading(false);

      // Fetch representatives
      if (data?.address) {
        setRepsLoading(true);
        try {
          const res = await fetch("/api/representatives", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ districts: data.district_map, address: data.address }),
          });
          const repData = await res.json();
          if (repData.representatives) {
            setReps(repData.representatives);
          }
        } catch { /* ignore */ }
        setRepsLoading(false);
      }
    });
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center civic-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  if (!profile) return null;

  return (
    <main className="flex-1 px-6 py-10 civic-bg">
      <div className="mx-auto max-w-2xl animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>

        <div className="space-y-5 stagger-children">
          {/* Address & Districts */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <div>
                  <CardTitle>Address & Districts</CardTitle>
                  <CardDescription>Your registered voting address</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Address</p>
                <p className="font-medium text-sm">{profile.address || "Not set"}</p>
              </div>
              {Object.keys(profile.district_map || {}).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Districts</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(profile.district_map || {}).map(
                      ([key, value]) => (
                        <Badge key={key} variant="secondary" className="capitalize">
                          {key.replace(/_/g, " ")}: {value}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/onboarding")}
              >
                Update address
              </Button>
            </CardContent>
          </Card>

          {/* Party */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                  </svg>
                </div>
                <div>
                  <CardTitle>Party Affiliation</CardTitle>
                  <CardDescription>Determines your primary election eligibility</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant="default" className="text-sm px-3 py-1">
                {profile.party_slug
                  ? PARTY_LABELS[profile.party_slug as PartySlugs]
                  : "Not set"}
              </Badge>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                </div>
                <div>
                  <CardTitle>Your Interests</CardTitle>
                  <CardDescription>We highlight candidate stances on these topics</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(profile.interest_slugs || []).map((slug: string) => (
                  <Badge key={slug} variant="default" className="px-3 py-1">
                    {INTEREST_LABELS[slug as InterestSlug] || slug}
                  </Badge>
                ))}
                {(profile.interest_slugs || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No interests selected</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Representatives */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                  </svg>
                </div>
                <div>
                  <CardTitle>Your Representatives</CardTitle>
                  <CardDescription>Elected officials for your address</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {repsLoading ? (
                <div className="space-y-2">
                  <div className="skeleton h-4 w-48" />
                  <div className="skeleton h-4 w-40" />
                  <div className="skeleton h-4 w-44" />
                </div>
              ) : reps.length > 0 ? (
                <div className="space-y-2">
                  {reps.slice(0, 6).map((rep, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{rep.name}</span>
                      <span className="text-muted-foreground text-xs">{rep.office}</span>
                    </div>
                  ))}
                  {reps.length > 6 && (
                    <p className="text-xs text-muted-foreground">+{reps.length - 6} more</p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => router.push("/representatives")}
                  >
                    View all representatives
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {profile?.address ? "Could not load representatives." : "Add an address to see your representatives."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sign out */}
          <Card className="shadow-sm border-destructive/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-destructive" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                  </svg>
                </div>
                <CardTitle>Account</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleSignOut}>
                Sign out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
