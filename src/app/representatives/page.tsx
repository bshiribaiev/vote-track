"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/lib/types/database";

interface Representative {
  name: string;
  office: string;
  level: "federal" | "state" | "local";
  party: string | null;
  photoUrl: string | null;
  phones: string[];
  urls: string[];
  channels: Array<{ type: string; id: string }>;
}

const LEVEL_CONFIG = {
  federal: {
    label: "Federal",
    color: "from-blue-600 to-indigo-700",
    badge: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
      </svg>
    ),
  },
  state: {
    label: "State",
    color: "from-emerald-600 to-teal-700",
    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
  local: {
    label: "Local",
    color: "from-amber-500 to-orange-600",
    badge: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
      </svg>
    ),
  },
} as const;

function partyColor(party: string | null) {
  if (!party) return "bg-gray-100 text-gray-600";
  const p = party.toLowerCase();
  if (p.includes("democrat")) return "bg-blue-100 text-blue-800";
  if (p.includes("republican")) return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-600";
}

function RepCard({ rep }: { rep: Representative }) {
  const config = LEVEL_CONFIG[rep.level];
  const website = rep.urls?.[0];
  const phone = rep.phones?.[0];
  const twitter = rep.channels?.find((c) => c.type === "Twitter");

  return (
    <div className="group rounded-xl border bg-white overflow-hidden hover:shadow-md transition-all duration-200">
      <div className={`h-1 bg-gradient-to-r ${config.color}`} />
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Photo */}
          {rep.photoUrl ? (
            <img
              src={rep.photoUrl}
              alt={rep.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100 shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0 ring-2 ring-gray-100">
              <span className="text-lg font-bold text-gray-400">
                {rep.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
              {rep.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{rep.office}</p>
            {rep.party && (
              <Badge className={`mt-2 border text-xs ${partyColor(rep.party)}`}>
                {rep.party}
              </Badge>
            )}
          </div>
        </div>

        {/* Contact links */}
        {(website || phone || twitter) && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Website
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
                {phone}
              </a>
            )}
            {twitter && (
              <a
                href={`https://twitter.com/${twitter.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                @{twitter.id}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RepresentativesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reps, setReps] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileData?.onboarded) {
        router.push("/onboarding");
        return;
      }

      setProfile(profileData);

      if (!profileData.district_map || Object.keys(profileData.district_map).length === 0) {
        setError("No district info on file. Update your address in Settings to see your representatives.");
        setLoading(false);
        return;
      }

      // Check localStorage cache (24-hour TTL)
      const CACHE_KEY = "my_representatives";
      const CACHE_TTL = 24 * 60 * 60 * 1000;
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { data: cachedData, ts, addr } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL && addr === profileData.address && Array.isArray(cachedData)) {
            setReps(cachedData);
            setLoading(false);
            return;
          }
        } catch { /* ignore */ }
      }

      try {
        const res = await fetch("/api/representatives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ districts: profileData.district_map, address: profileData.address }),
        });
        const data = await res.json();

        if (data.representatives) {
          setReps(data.representatives);
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: data.representatives,
            ts: Date.now(),
            addr: profileData.address,
          }));
        } else {
          setError(data.error || "Could not load representatives.");
        }
      } catch {
        setError("Failed to load representatives.");
      }

      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center civic-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your representatives...</p>
        </div>
      </main>
    );
  }

  const federal = reps.filter((r) => r.level === "federal");
  const state = reps.filter((r) => r.level === "state");
  const local = reps.filter((r) => r.level === "local");

  const levels = [
    { key: "federal" as const, reps: federal },
    { key: "state" as const, reps: state },
    { key: "local" as const, reps: local },
  ].filter((l) => l.reps.length > 0);

  return (
    <main className="flex-1 px-6 py-10 civic-bg">
      <div className="mx-auto max-w-5xl animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Your Representatives</h1>
          {profile?.address && (
            <p className="text-muted-foreground mt-1">
              Based on {profile.address.split(",")[0]}
            </p>
          )}
        </div>

        {error ? (
          <div className="rounded-xl border bg-white p-12 text-center">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : reps.length === 0 ? (
          <div className="rounded-xl border bg-white p-12 text-center">
            <p className="text-muted-foreground">No representatives found for your address.</p>
          </div>
        ) : (
          <div className="space-y-8 stagger-children">
            {levels.map(({ key, reps: levelReps }) => {
              const config = LEVEL_CONFIG[key];
              return (
                <section key={key}>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center text-white`}>
                      {config.icon}
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg leading-tight">{config.label}</h2>
                      <p className="text-xs text-muted-foreground">{levelReps.length} representative{levelReps.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {levelReps.map((rep, i) => (
                      <RepCard key={`${rep.name}-${i}`} rep={rep} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
