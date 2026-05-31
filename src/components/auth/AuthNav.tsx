"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function AuthNav() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!ready) {
    return <span className="text-xs text-white/55">…</span>;
  }

  if (!user) {
    return (
      <Link href="/login" className="sc-btn block w-full text-center text-xs">
        Sign in
      </Link>
    );
  }

  const label =
    user.user_metadata?.user_name ??
    user.user_metadata?.preferred_username ??
    user.email ??
    "Account";

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span
        className="block min-w-0 truncate rounded-xl border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs text-white/90"
        title={label}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        className="sc-btn-ghost w-full truncate text-left text-xs"
      >
        Sign out
      </button>
    </div>
  );
}
