export class HypixelApiError extends Error {
  readonly status: number;
  readonly cause: string | null;

  constructor(status: number, cause: string | null) {
    super(formatHypixelApiError(status, cause));
    this.name = "HypixelApiError";
    this.status = status;
    this.cause = cause;
  }
}

export function formatHypixelApiError(
  status: number,
  cause: string | null,
): string {
  if (status === 403) {
    if (cause?.toLowerCase().includes("invalid api key")) {
      return "Hypixel rejected the server API key (invalid or expired). Update HYPIXEL_API_KEY in .env.local — create a new key at developer.hypixel.net.";
    }
    return cause ?? "Hypixel API access forbidden (403).";
  }

  if (status === 429) {
    return cause ?? "Hypixel API rate limit exceeded. Try again shortly.";
  }

  return cause ?? `Hypixel API error (${status})`;
}

export function getHypixelApiKey(): string {
  const key = process.env.HYPIXEL_API_KEY?.trim();
  if (!key || key === "your-hypixel-api-key") {
    throw new Error(
      "HYPIXEL_API_KEY is not configured. Add a key from developer.hypixel.net to .env.local.",
    );
  }
  return key;
}

export async function readHypixelErrorBody(
  res: Response,
): Promise<string | null> {
  try {
    const data = (await res.json()) as { cause?: string; success?: boolean };
    return typeof data.cause === "string" ? data.cause : null;
  } catch {
    return null;
  }
}
