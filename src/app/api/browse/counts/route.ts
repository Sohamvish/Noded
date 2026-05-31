import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchBrowseLayerCounts } from "@/lib/browse/queries";
import type { BrowseCountsResponse } from "@/lib/browse/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skillId = searchParams.get("skillId")?.trim().toUpperCase() ?? "";

  if (!skillId) {
    return NextResponse.json(
      { error: "skillId is required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const layers = await fetchBrowseLayerCounts(supabase, skillId);
    const body: BrowseCountsResponse = { skillId, layers };
    return NextResponse.json(body);
  } catch (error) {
    console.error("[api/browse/counts]", error);
    return NextResponse.json(
      { error: "Failed to load layer counts." },
      { status: 500 },
    );
  }
}
