/** Escape user input for PostgREST `.or()` / `.filter()` ilike patterns. */
export function escapePostgrestFilter(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export function parsePositiveInt(
  raw: string | null,
  fallback: number,
  max: number,
): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

export function parseBooleanParam(raw: string | null, fallback = false): boolean {
  if (raw === null || raw === "") return fallback;
  const v = raw.toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}
