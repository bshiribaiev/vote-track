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

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
    });
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (!profile) return null;

  return (
    <main className="flex-1 px-6 py-8 bg-gray-50/50">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Address & Districts */}
          <Card>
            <CardHeader>
              <CardTitle>Address & Districts</CardTitle>
              <CardDescription>Your registered voting address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{profile.address || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Districts</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(profile.district_map || {}).map(
                    ([key, value]) => (
                      <Badge key={key} variant="secondary">
                        {key.replace(/_/g, " ")}: {value}
                      </Badge>
                    )
                  )}
                </div>
              </div>
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
          <Card>
            <CardHeader>
              <CardTitle>Party Affiliation</CardTitle>
              <CardDescription>
                Determines your primary election eligibility
              </CardDescription>
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
          <Card>
            <CardHeader>
              <CardTitle>Your Interests</CardTitle>
              <CardDescription>
                We highlight candidate stances on these topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(profile.interest_slugs || []).map((slug: string) => (
                  <Badge key={slug} variant="default" className="px-3 py-1">
                    {INTEREST_LABELS[slug as InterestSlug] || slug}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sign out */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
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
