import { NextResponse } from "next/server";
import { parseBooleanParam } from "@/lib/api/query";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/get-user";
import { parseNeuDisplay } from "@/lib/items/parse-neu-display";
import type { MaterialLine, MaterialsApiResponse } from "@/lib/items/types";
import {
  getOwnedQuantity,
  mergeMaterialMaps,
  rollupMaterialsForTarget,
} from "@/lib/materials/rollup-materials";
import type { DependencySubgraphRow } from "@/types/database";

const DISCLAIMER =
  "Quantities use the simplest recipe path per item. Stackable inventory counts are not tracked yet — sync covers unique items and collections.";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetsParam = searchParams.get("targets")?.trim() ?? "";
  const expandBases = parseBooleanParam(searchParams.get("expandBases"), false);

  const goalIds = targetsParam
    .split(",")
    .map((id) => id.trim().toUpperCase())
    .filter(Boolean);

  if (goalIds.length === 0) {
    return NextResponse.json(
      { error: "At least one target is required in targets query param." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const user = await getAuthUser();

  let completedItems: string[] = [];
  let collections: Record<string, number> = {};

  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("completed_items, cached_collections")
      .eq("id", user.id)
      .maybeSingle();

    completedItems = profile?.completed_items ?? [];
    collections =
      (profile?.cached_collections as Record<string, number>) ?? {};
  }

  const maps: Array<Map<string, number>> = [];

  for (const target of goalIds) {
    const { data: rows, error: rpcError } = await supabase.rpc(
      "get_dependency_subgraph",
      {
        target_internal_id: target,
        expand_bases: expandBases,
      },
    );

    if (rpcError) {
      console.error("[api/materials] rpc", target, rpcError);
      return NextResponse.json(
        { error: `Failed to load dependencies for ${target}.` },
        { status: 500 },
      );
    }

    maps.push(
      rollupMaterialsForTarget(
        (rows ?? []) as DependencySubgraphRow[],
        target,
        1,
      ),
    );
  }

  const merged = mergeMaterialMaps(maps, goalIds);
  const internalIds = merged.map((line) => line.internalId);

  const metaById = new Map<
    string,
    {
      displayName: string;
      tier: string | null;
      slayerReq: string | null;
      craftText: string | null;
      rawNeu: Record<string, unknown> | null;
      hasRecipe: boolean;
    }
  >();

  if (internalIds.length > 0) {
    const { data: itemRows, error: itemsError } = await supabase
      .from("items")
      .select(
        "id, internal_id, display_name, tier, slayer_req, craft_text, raw_neu_data",
      )
      .in("internal_id", internalIds);

    if (itemsError) {
      console.error("[api/materials] items", itemsError);
      return NextResponse.json(
        { error: "Failed to load item metadata." },
        { status: 500 },
      );
    }

    const itemUuids = (itemRows ?? []).map((row) => row.id);
    const recipeResultIds = new Set<string>();

    if (itemUuids.length > 0) {
      const { data: recipeRows, error: recipeError } = await supabase
        .from("recipes")
        .select("result_item_id")
        .in("result_item_id", itemUuids);

      if (recipeError) {
        console.error("[api/materials] recipes", recipeError);
        return NextResponse.json(
          { error: "Failed to load recipe metadata." },
          { status: 500 },
        );
      }

      for (const row of recipeRows ?? []) {
        recipeResultIds.add(row.result_item_id);
      }
    }

    for (const row of itemRows ?? []) {
      metaById.set(row.internal_id, {
        displayName: row.display_name,
        tier: row.tier,
        slayerReq: row.slayer_req,
        craftText: row.craft_text,
        rawNeu: row.raw_neu_data as Record<string, unknown> | null,
        hasRecipe: recipeResultIds.has(row.id),
      });
    }
  }

  const lines: MaterialLine[] = merged.flatMap((req) => {
    const meta = metaById.get(req.internalId);
    if (!meta) return [];

    const display = parseNeuDisplay(meta.rawNeu, req.internalId);
    const ownedQty = user
      ? getOwnedQuantity(
          req.internalId,
          completedItems,
          collections,
          req.requiredQty,
        )
      : null;

    const progressPct =
      ownedQty != null && req.requiredQty > 0
        ? Math.min(100, Math.round((ownedQty / req.requiredQty) * 100))
        : null;

    const isTerminal = !meta.hasRecipe;

    return [
      {
        internalId: req.internalId,
        displayName: meta.displayName,
        tier: meta.tier,
        requiredQty: req.requiredQty,
        ownedQty,
        progressPct,
        source: isTerminal ? "terminal" : "craft",
        hint: isTerminal
          ? (meta.slayerReq ?? meta.craftText ?? "Off-map requirement")
          : null,
        iconUrl: display.iconUrl,
        coloredName: display.coloredName,
        loreLines: display.loreLines,
        contributingGoals: req.contributingGoals,
      },
    ];
  });

  lines.sort((a, b) => {
    const aDone = a.progressPct === 100 ? 1 : 0;
    const bDone = b.progressPct === 100 ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return b.requiredQty - a.requiredQty;
  });

  const body: MaterialsApiResponse = {
    lines,
    expandBases,
    goalIds,
    disclaimer: DISCLAIMER,
  };

  return NextResponse.json(body);
}
