"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useProfileStore } from "@/stores/profile-store";

function formatStat(value: number | null, loading: boolean): string {
  if (loading) return "…";
  if (value == null) return "—";
  return value.toLocaleString();
}

function formatSyncHint(lastSyncAt: string | null, signedIn: boolean): string {
  if (!signedIn) return "Sign in to sync from Hypixel";
  if (!lastSyncAt) return "No sync yet — open Profile Sync";
  const date = new Date(lastSyncAt);
  if (Number.isNaN(date.getTime())) return "Synced from Hypixel";
  return `Last sync ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

export function KpiRow() {
  const profile = useProfileStore((s) => s.profile);
  const isLoading = useProfileStore((s) => s.isLoading);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);

  const goals = useDashboardStore((s) => s.goals);
  const fetchGoals = useDashboardStore((s) => s.fetchGoals);

  useEffect(() => {
    void fetchProfile();
    void fetchGoals();
  }, [fetchProfile, fetchGoals]);

  const skillCount = profile
    ? Object.keys(profile.cachedSkills).length
    : null;
  const collectionCount = profile
    ? Object.keys(profile.cachedCollections).length
    : null;
  const completedCount = profile ? profile.completedItems.length : null;
  const hasSynced = Boolean(profile?.lastSyncAt);

  const cards = [
    {
      label: "Total Skills",
      value: formatStat(skillCount, isLoading && profile === null),
      hint: hasSynced
        ? formatSyncHint(profile?.lastSyncAt ?? null, true)
        : isLoading
          ? "Loading…"
          : "Sign in & sync from Hypixel",
    },
    {
      label: "Total Collections",
      value: formatStat(collectionCount, isLoading && profile === null),
      hint: profile?.profileCuteName ?? (hasSynced ? "Synced collections" : "Unique items tracked"),
    },
    {
      label: "Items Completed",
      value: formatStat(completedCount, isLoading && profile === null),
      hint: profile?.minecraftUsername
        ? `@${profile.minecraftUsername}`
        : "Owned items from sync",
    },
    {
      label: "Pinned Goals",
      value: goals.length.toLocaleString(),
      hint: "Active quest board",
    },
  ] as const;

  return (
    <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className="nd-glass-card flex min-w-0 flex-col gap-1 rounded-2xl p-4"
        >
          <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-white/65">
            {card.label}
          </p>
          <p className="sc-stat text-2xl text-white">{card.value}</p>
          <p className="truncate text-xs text-white/55" title={card.hint}>
            {card.hint}
          </p>
        </article>
      ))}
    </div>
  );
}
