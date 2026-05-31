import { NextResponse } from "next/server";
import { parseBooleanParam } from "@/lib/api/query";
import { requireAuthUser } from "@/lib/auth/require-user";
import {
  extractSkills,
  findMember,
  flattenCollections,
  pickProfile,
} from "@/lib/hypixel/extract-member-data";
import { fetchSkyblockProfiles } from "@/lib/hypixel/fetch-profiles";
import { HypixelApiError } from "@/lib/hypixel/api-errors";
import { fetchMojangProfile } from "@/lib/hypixel/mojang";
import {
  mergeCompletedItems,
  parseInventoryFromMember,
} from "@/lib/hypixel/parse-inventory";
import {
  canSyncNow,
  syncCooldownRemainingMs,
} from "@/lib/hypixel/sync-rate-limit";
import { SYNC_COOLDOWN_MINUTES } from "@/lib/hypixel/constants";
import { createClient } from "@/lib/supabase/server";

interface SyncRequestBody {
  minecraftUsername?: string;
  profileId?: string;
  /** When true, parse inventory NBT and merge into completed_items. */
  includeInventory?: boolean;
}

export async function POST(request: Request) {
  const auth = await requireAuthUser();
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const deepFromQuery = searchParams.get("deep");

  const apiKey = process.env.HYPIXEL_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Hypixel API is not configured on the server." },
      { status: 503 },
    );
  }

  let body: SyncRequestBody = {};
  try {
    body = (await request.json()) as SyncRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const includeInventory =
    body.includeInventory ??
    parseBooleanParam(deepFromQuery, true);

  const username = body.minecraftUsername?.trim();
  if (!username) {
    return NextResponse.json(
      { error: "minecraftUsername is required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("last_api_sync_at, completed_items")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[hypixel/sync] profile read", profileError);
    return NextResponse.json(
      { error: "Failed to load user profile" },
      { status: 500 },
    );
  }

  if (!canSyncNow(profile?.last_api_sync_at ?? null)) {
    const remainingMs = syncCooldownRemainingMs(profile?.last_api_sync_at ?? null);
    const retryAfterSec = Math.ceil(remainingMs / 1000);
    return NextResponse.json(
      {
        error: `Sync rate limit: wait ${SYNC_COOLDOWN_MINUTES} minutes between syncs.`,
        retryAfterSec,
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      },
    );
  }

  let mojang;
  try {
    mojang = await fetchMojangProfile(username);
  } catch (err) {
    console.error("[hypixel/sync] mojang", err);
    return NextResponse.json(
      { error: "Failed to resolve Minecraft username" },
      { status: 502 },
    );
  }

  if (!mojang) {
    return NextResponse.json(
      { error: `Minecraft player not found: ${username}` },
      { status: 404 },
    );
  }

  let skyblockProfiles;
  try {
    skyblockProfiles = await fetchSkyblockProfiles(mojang.uuid);
  } catch (err) {
    console.error("[hypixel/sync] hypixel", err);
    const message =
      err instanceof HypixelApiError
        ? err.message
        : "Failed to fetch Skyblock profiles from Hypixel";
    const status =
      err instanceof HypixelApiError && err.status === 403 ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }

  const selected = pickProfile(skyblockProfiles, body.profileId);
  if (!selected) {
    return NextResponse.json(
      { error: "No Skyblock profiles found for this account" },
      { status: 404 },
    );
  }

  const member = findMember(selected, mojang.uuid);
  if (!member) {
    return NextResponse.json(
      {
        error:
          "Could not read profile member data. Check Skyblock API settings (collections/skills).",
      },
      { status: 422 },
    );
  }

  const cached_collections = flattenCollections(member.collection);
  const cached_skills = extractSkills(member.player_data?.experience);
  const syncedAt = new Date().toISOString();

  let inventoryResult: Awaited<ReturnType<typeof parseInventoryFromMember>> | null =
    null;
  let completed_items = profile?.completed_items ?? [];

  if (includeInventory) {
    inventoryResult = await parseInventoryFromMember(
      member as Record<string, unknown>,
    );
    completed_items = mergeCompletedItems(
      profile?.completed_items,
      inventoryResult.internalIds,
    );
  }

  const { error: updateError } = await supabase.from("user_profiles").upsert(
    {
      id: auth.user.id,
      minecraft_uuid: mojang.uuid,
      minecraft_username: mojang.name,
      hypixel_profile_id: selected.profile_id,
      profile_cute_name: selected.cute_name,
      cached_collections,
      cached_skills,
      completed_items,
      last_api_sync_at: syncedAt,
    },
    { onConflict: "id" },
  );

  if (updateError) {
    console.error("[hypixel/sync] profile update", updateError);
    return NextResponse.json(
      { error: "Failed to save synced profile data" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    syncedAt,
    minecraftUuid: mojang.uuid,
    minecraftUsername: mojang.name,
    profileId: selected.profile_id,
    profileCuteName: selected.cute_name,
    gameMode: selected.game_mode ?? null,
    collectionCount: Object.keys(cached_collections).length,
    skillCount: Object.keys(cached_skills).length,
    includeInventory,
    inventoryBlobsFound: inventoryResult?.blobsFound ?? 0,
    inventorySourcesParsed: inventoryResult?.parsedSources ?? [],
    inventoryItemCount: inventoryResult?.internalIds.length ?? 0,
    inventoryParseErrors: inventoryResult?.errors ?? [],
    completedItemsCount: completed_items.length,
    inventoryApiHint:
      includeInventory &&
      inventoryResult &&
      inventoryResult.blobsFound === 0
        ? "No inventory data returned. Enable Inventory, Ender Chest, and Wardrobe in Skyblock → Settings → API."
        : null,
  });
}
