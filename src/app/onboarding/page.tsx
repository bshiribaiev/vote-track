"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  type InterestSlug,
  type PartySlugs,
  type DistrictMap,
} from "@/lib/types/database";

const STEPS = ["Address", "Party", "Interests"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [address, setAddress] = useState("");
  const [districtMap, setDistrictMap] = useState<DistrictMap>({});
  const [districtLoading, setDistrictLoading] = useState(false);
  const [districtError, setDistrictError] = useState<string | null>(null);
  const [partySlug, setPartySlug] = useState<PartySlugs | null>(null);
  const [interestSlugs, setInterestSlugs] = useState<InterestSlug[]>([]);

  // Google Places
  const placesContainerRef = useRef<HTMLDivElement>(null);
  const placesInitialized = useRef(false);

  const lookupDistrictsForAddress = useCallback(async (addr: string) => {
    if (!addr.trim()) return;
    setDistrictLoading(true);
    setDistrictError(null);

    try {
      const res = await fetch("/api/civic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      });
      const data = await res.json();

      if (!res.ok) {
        setDistrictError(data.error);
        setDistrictLoading(false);
        return;
      }

      setDistrictMap(data.districts);
    } catch {
      setDistrictError("Failed to look up districts");
    }
    setDistrictLoading(false);
  }, []);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === "your-google-maps-api-key") return;
    if (document.getElementById("google-maps-script")) return;

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // Init autocomplete when on step 0
  useEffect(() => {
    if (step !== 0) return;
    if (placesInitialized.current) return;
    if (!placesContainerRef.current) return;

    function tryInit() {
      if (!window.google?.maps?.places) return false;
      if (placesInitialized.current) return true;

      placesInitialized.current = true;

      // Use the legacy Autocomplete attached to a real input
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Start typing your address...";
      input.className = "w-full px-3 py-2 text-sm outline-none bg-transparent";

      placesContainerRef.current!.innerHTML = "";
      placesContainerRef.current!.appendChild(input);

      const autocomplete = new google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: "us" },
        fields: ["formatted_address"],
        types: ["address"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place?.formatted_address) {
          setAddress(place.formatted_address);
          lookupDistrictsForAddress(place.formatted_address);
        }
      });

      return true;
    }

    if (tryInit()) return;

    // Poll until Google Maps is loaded
    const interval = setInterval(() => {
      if (tryInit()) clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, [step, lookupDistrictsForAddress]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUserId(user.id);
    });
  }, [router]);

  function toggleInterest(slug: InterestSlug) {
    setInterestSlugs((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
  }

  async function handleFinish() {
    if (!userId) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        address,
        party_slug: partySlug,
        interest_slugs: interestSlugs,
        district_map: districtMap,
        onboarded: true,
      })
      .eq("id", userId);

    if (error) {
      console.error("Failed to save profile:", error);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  const canProceed = () => {
    switch (step) {
      case 0:
        return address.trim().length > 0 && Object.keys(districtMap).length > 0;
      case 1:
        return partySlug !== null;
      case 2:
        return interestSlugs.length > 0;
      default:
        return false;
    }
  };

  return (
    <main className="flex-1 flex items-start justify-center px-4 pt-16 pb-12 bg-gray-50/50">
      <Card className="w-full max-w-xl min-h-[420px] flex flex-col">
        <CardHeader className="text-center">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    i <= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-10 rounded-full transition-colors ${
                      i < step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <CardTitle className="text-2xl">
            {step === 0 && "Where do you live?"}
            {step === 1 && "Party affiliation"}
            {step === 2 && "What issues matter to you?"}
          </CardTitle>
          <CardDescription>
            {step === 0 &&
              "We'll use your address to find your voting districts."}
            {step === 1 &&
              "This determines which primary elections you're eligible for."}
            {step === 2 &&
              "Select the topics you care about most. We'll highlight where candidates stand on these."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Step 1: Address */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your address</Label>
                <div ref={placesContainerRef} className="places-wrapper rounded-md border border-input bg-background overflow-hidden" />
                {districtLoading && (
                  <p className="text-sm text-muted-foreground">Looking up your districts...</p>
                )}
                {districtError && (
                  <p className="text-sm text-destructive">{districtError}</p>
                )}
                {address && !districtLoading && Object.keys(districtMap).length === 0 && (
                  <p className="text-sm text-muted-foreground">Selected: {address}</p>
                )}
              </div>

              {Object.keys(districtMap).length > 0 && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                    Your districts
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {districtMap.city_council && (
                      <div className="rounded-md bg-white p-2.5 border">
                        <p className="text-xs text-muted-foreground">City Council</p>
                        <p className="font-semibold">District {districtMap.city_council}</p>
                      </div>
                    )}
                    {districtMap.state_assembly && (
                      <div className="rounded-md bg-white p-2.5 border">
                        <p className="text-xs text-muted-foreground">Assembly</p>
                        <p className="font-semibold">District {districtMap.state_assembly}</p>
                      </div>
                    )}
                    {districtMap.state_senate && (
                      <div className="rounded-md bg-white p-2.5 border">
                        <p className="text-xs text-muted-foreground">State Senate</p>
                        <p className="font-semibold">District {districtMap.state_senate}</p>
                      </div>
                    )}
                    {districtMap.congressional && (
                      <div className="rounded-md bg-white p-2.5 border">
                        <p className="text-xs text-muted-foreground">Congress</p>
                        <p className="font-semibold">District {districtMap.congressional}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Party */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(PARTY_LABELS) as [PartySlugs, string][]).map(
                ([slug, label]) => (
                  <button
                    key={slug}
                    onClick={() => setPartySlug(slug)}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      partySlug === slug
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <p className="font-medium">{label}</p>
                  </button>
                )
              )}
            </div>
          )}

          {/* Step 3: Interests */}
          {step === 2 && (
            <div className="flex flex-wrap gap-3">
              {(
                Object.entries(INTEREST_LABELS) as [InterestSlug, string][]
              ).map(([slug, label]) => (
                <button
                  key={slug}
                  onClick={() => toggleInterest(slug)}
                  className={`rounded-full border-2 px-3.5 py-1 text-sm font-medium transition-all ${
                    interestSlugs.includes(slug)
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-auto pt-8">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={!canProceed() || loading}
              >
                {loading ? "Saving..." : "Finish setup"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
