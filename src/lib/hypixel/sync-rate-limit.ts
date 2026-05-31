import { SYNC_COOLDOWN_MINUTES } from "./constants";

export function syncCooldownRemainingMs(lastSyncAt: string | null): number {
  if (!lastSyncAt) return 0;

  const elapsed = Date.now() - new Date(lastSyncAt).getTime();
  const cooldownMs = SYNC_COOLDOWN_MINUTES * 60 * 1000;
  return Math.max(0, cooldownMs - elapsed);
}

export function canSyncNow(lastSyncAt: string | null): boolean {
  return syncCooldownRemainingMs(lastSyncAt) === 0;
}
