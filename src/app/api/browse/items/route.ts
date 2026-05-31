import { NextResponse } from "next/server";
import { parsePositiveInt } from "@/lib/api/query";
import { createClient } from "@/lib/supabase/server";
import {
  fetchBrowseItems,
  INFERRED_PAGE_SIZE,
} from "@/lib/browse/queries";
import type { BrowseItemsResponse } from "@/lib/browse/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skillId = searchParams.get("skillId")?.trim().toUpperCase() ?? "";
  const layer = parsePositiveInt(searchParams.get("layer"), 1, 5);
  const inferredOffset = parsePositiveInt(searchParams.get("offset"), 0, 10_000);
  const inferredLimit = parsePositiveInt(
    searchParams.get("limit"),
    INFERRED_PAGE_SIZE,
    100,
  );

  if (!skillId) {
    return NextResponse.json(
      { error: "skillId is required." },
      { status: 400 },
    );
  }

  if (layer < 1 || layer > 5) {
    return NextResponse.json(
      { error: "layer must be between 1 and 5." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const result = await fetchBrowseItems(
      supabase,
      skillId,
      layer,
      inferredOffset,
      inferredLimit,
    );

    const body: BrowseItemsResponse = {
      skillId,
      layer,
      curated: result.curated,
      inferred: result.inferred,
      inferredOffset,
      inferredLimit,
      inferredTotal: result.inferredTotal,
      hasMoreInferred: result.hasMoreInferred,
    };

    return NextResponse.json(body);
  } catch (error) {
    console.error("[api/browse/items]", error);
    return NextResponse.json(
      { error: "Failed to load browse items." },
      { status: 500 },
    );
  }
}
