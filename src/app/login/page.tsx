import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="sc-panel w-full max-w-sm space-y-6 p-6">
        <div className="space-y-2 text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-sc-logo/20 text-lg font-bold text-sc-logo ring-1 ring-sc-logo/40"
            aria-hidden
          >
            ND
          </div>
          <h1 className="text-xl font-semibold text-sc-link">Sign in to Noded</h1>
          <p className="text-sm text-white/50">
            Save progress and sync your Skyblock profile.
          </p>
        </div>

        <LoginForm />

        <LoginErrorFromParams searchParams={searchParams} />

        <p className="text-center text-xs text-white/40">
          <Link href="/" className="text-sc-link hover:text-sc-hover">
            ← Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}

async function LoginErrorFromParams({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  if (!params.error) return null;

  const message =
    params.error === "exchange_failed"
      ? "Sign-in failed. Try again."
      : "Could not complete sign-in.";

  return (
    <p className="text-center text-sm text-red-400" role="alert">
      {message}
    </p>
  );
}
