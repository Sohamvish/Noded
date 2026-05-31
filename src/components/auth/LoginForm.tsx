"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function getRedirectUrl(path: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return `${base}${path}`;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signInWithGitHub = async () => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: getRedirectUrl("/auth/callback"),
      },
    });

    setIsSubmitting(false);
    if (oauthError) {
      setError(oauthError.message);
    }
  };

  const signInWithEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: getRedirectUrl("/auth/callback"),
      },
    });

    setIsSubmitting(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }

    setMessage("Check your email for the magic link.");
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => void signInWithGitHub()}
        className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
      >
        Continue with GitHub
      </button>

      <div className="flex items-center gap-3 text-xs text-white/40">
        <span className="h-px flex-1 bg-white/10" />
        or magic link
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={signInWithEmail} className="flex flex-col gap-3">
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="sc-input"
        />
        <button
          type="submit"
          disabled={isSubmitting || !email.trim()}
          className="sc-btn disabled:opacity-50"
        >
          Email me a link
        </button>
      </form>

      {message ? (
        <p className="text-sm text-sc-link" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
