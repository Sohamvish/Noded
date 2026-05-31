import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/get-user";
import type { ProfileApiResponse } from "@/lib/items/types";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "minecraft_username, profile_cute_name, completed_items, cached_collections, cached_skills, last_api_sync_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[api/profile] GET", error);
    return NextResponse.json(
      { error: "Failed to load profile." },
      { status: 500 },
    );
  }

  const body: ProfileApiResponse = {
    minecraftUsername: data?.minecraft_username ?? null,
    profileCuteName: data?.profile_cute_name ?? null,
    completedItems: data?.completed_items ?? [],
    cachedCollections: (data?.cached_collections as Record<string, number>) ?? {},
    cachedSkills: (data?.cached_skills as Record<string, number>) ?? {},
    lastSyncAt: data?.last_api_sync_at ?? null,
  };

  return NextResponse.json(body);
}
