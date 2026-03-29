import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user needs onboarding
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarded")
          .eq("id", user.id)
          .single();

        const redirectTo = profile?.onboarded ? next : "/onboarding";
        return Response.redirect(new URL(redirectTo, request.url));
      }
    }
  }

  return Response.redirect(new URL("/auth/login", request.url));
}
