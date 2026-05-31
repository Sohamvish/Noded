"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SYNC_COOLDOWN_MINUTES } from "@/lib/hypixel/constants";
import { SkyCryptPanel } from "@/components/layout/SkyCryptPanel";
import { useProfileStore } from "@/stores/profile-store";
import type { User } from "@supabase/supabase-js";

interface SyncSuccess {
  syncedAt: string;
  minecraftUsername: string;
  profileCuteName: string;
  collectionCount: number;
  skillCount: number;
  inventoryItemCount?: number;
  completedItemsCount?: number;
  inventoryApiHint?: string | null;
  inventoryParseErrors?: Array<{ source: string; message: string }>;
}

export interface ProfileSyncPanelProps {
  fullPage?: boolean;
}

function formatLastSync(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ProfileSyncPanel({ fullPage = false }: ProfileSyncPanelProps) {
  const profile = useProfileStore((s) => s.profile);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [username, setUsername] = useState("");
  const [includeInventory, setIncludeInventory] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<SyncSuccess | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;
    void fetchProfile();
  }, [authReady, user, fetchProfile]);

  useEffect(() => {
    if (profile?.minecraftUsername && !username) {
      setUsername(profile.minecraftUsername);
    }
  }, [profile?.minecraftUsername, username]);

  const sync = async () => {
    const minecraftUsername = username.trim();
    if (!minecraftUsername) return;

    setIsSyncing(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (includeInventory) params.set("deep", "true");

      const res = await fetch(`/api/hypixel/sync?${params}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minecraftUsername, includeInventory }),
      });

      const body = (await res.json()) as SyncSuccess & {
        error?: string;
        retryAfterSec?: number;
      };

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Sign in to sync your Skyblock profile.");
        }
        if (res.status === 429 && body.retryAfterSec) {
          const mins = Math.ceil(body.retryAfterSec / 60);
          throw new Error(
            body.error ?? `Rate limited — try again in ~${mins} min.`,
          );
        }
        throw new Error(body.error ?? `Sync failed (${res.status})`);
      }

      setLastSync(body);
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  if (!authReady) {
    return null;
  }

  const syncedProfile = lastSync ?? (profile?.lastSyncAt
    ? {
        profileCuteName: profile.profileCuteName ?? "Profile",
        collectionCount: Object.keys(profile.cachedCollections).length,
        skillCount: Object.keys(profile.cachedSkills).length,
        completedItemsCount: profile.completedItems.length,
        minecraftUsername: profile.minecraftUsername ?? "",
        syncedAt: profile.lastSyncAt,
      }
    : null);

  const lastSyncLabel = formatLastSync(
    lastSync?.syncedAt ?? profile?.lastSyncAt ?? null,
  );

  const signInPrompt = (
    <SkyCryptPanel title="Profile sync" accent="teal" className="h-full">
      <p className="text-sm text-white/75">
        <Link href="/login" className="font-medium text-[#a5f3fc] hover:text-white">
          Sign in
        </Link>{" "}
        to sync collections, skills, and inventory from Hypixel.
      </p>
    </SkyCryptPanel>
  );

  if (!user) {
    return signInPrompt;
  }

  const stats = syncedProfile
    ? [
        { label: "Collections", value: syncedProfile.collectionCount },
        { label: "Skills", value: syncedProfile.skillCount },
        {
          label: "Owned items",
          value: syncedProfile.completedItemsCount ?? "—",
        },
      ]
    : [];

  const panel = (
    <SkyCryptPanel
      title="Hypixel profile sync"
      accent="teal"
      className={fullPage ? "h-full" : ""}
      action={
        syncedProfile ? (
          <span className="sc-chip sc-chip-teal font-normal">Synced</span>
        ) : null
      }
    >
      <div className="space-y-4">
        {syncedProfile ? (
          <div className="nd-glass-inset rounded-xl p-4">
            <p className="text-sm font-semibold text-white">
              {syncedProfile.profileCuteName}
            </p>
            <p className="mt-1 text-xs text-white/65">
              {syncedProfile.minecraftUsername
                ? `@${syncedProfile.minecraftUsername}`
                : "Linked Skyblock profile"}
              {lastSyncLabel ? ` · ${lastSyncLabel}` : ""}
            </p>
            <dl className="mt-3 grid grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-widest text-white/55">
                    {stat.label}
                  </dt>
                  <dd className="sc-stat mt-0.5 text-lg text-white">
                    {typeof stat.value === "number"
                      ? stat.value.toLocaleString()
                      : stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <p className="text-sm text-white/65">
            Link your Minecraft account to track material progress on the quest
            board.
          </p>
        )}

        <div className="nd-glass-inset space-y-3 rounded-xl p-4">
          <p className="text-xs text-white/65">
            Enable Inventory, Ender Chest, and Wardrobe in Skyblock API settings.
            Limit: once per {SYNC_COOLDOWN_MINUTES} min.
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-white/65">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-white/20 bg-black/40 accent-[#a5f3fc]"
              checked={includeInventory}
              onChange={(e) => setIncludeInventory(e.target.checked)}
            />
            Scan inventory NBT for owned items (deep sync)
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Minecraft username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="sc-input min-w-[140px] flex-1 py-2 text-sm"
            />
            <button
              type="button"
              disabled={isSyncing || !username.trim()}
              onClick={() => void sync()}
              className="sc-btn text-sm disabled:opacity-50"
            >
              {isSyncing ? "Syncing…" : "Sync now"}
            </button>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        {lastSync?.inventoryApiHint ? (
          <p className="text-xs text-[#fde047]">{lastSync.inventoryApiHint}</p>
        ) : null}
      </div>
    </SkyCryptPanel>
  );

  return panel;
}
