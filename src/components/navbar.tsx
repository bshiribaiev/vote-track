"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        setIsAdmin(data?.is_admin || false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-white/85 backdrop-blur-xl">
      <div className="h-0.5 bg-gradient-to-r from-primary via-blue-400 to-primary" />
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/20 group-hover:shadow-md group-hover:shadow-primary/25 transition-shadow">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">VoteTrack</span>
        </Link>
        <div className="flex items-center gap-1">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" className="px-3 py-2">
                  My Ballot
                </Button>
              </Link>
              <Link href="/representatives">
                <Button variant="ghost" className="px-3 py-2">
                  My Reps
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" className="px-3 py-2">
                  Settings
                </Button>
              </Link>
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" className="px-3 py-2">
                    Admin
                  </Button>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
