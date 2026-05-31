import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildCategoryOrFilter,
  itemMatchesSkill,
  layerLabel,
  tierToLayer,
  tiersForLayer,
} from "@/lib/browse/categorize";
import type {
  BrowseItem,
  BrowseLayerSummary,
  BrowseSkill,
} from "@/lib/browse/types";
import type { Database } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

const INFERRED_PAGE_SIZE = 40;

interface ItemRow {
  internal_id: string;
  display_name: string;
  tier: string | null;
  category: string | null;
}

interface CuratedRow {
  internal_id: string;
  sort_order: number;
  label_override: string | null;
  items: ItemRow | ItemRow[] | null;
}

function mapCuratedRow(row: CuratedRow): BrowseItem | null {
  const item = Array.isArray(row.items) ? row.items[0] : row.items;
  if (!item) return null;

  return {
    internalId: item.internal_id,
    displayName: item.display_name,
    tier: item.tier,
    mapLabel: row.label_override ?? item.display_name,
    source: "curated",
    sortOrder: row.sort_order,
  };
}

function mapInferredRow(row: ItemRow): BrowseItem {
  return {
    internalId: row.internal_id,
    displayName: row.display_name,
    tier: row.tier,
    mapLabel: row.display_name,
    source: "inferred",
    sortOrder: 9999,
  };
}

export async function fetchBrowseSkills(
  supabase: AdminClient,
): Promise<BrowseSkill[]> {
  const { data, error } = await supabase
    .from("roadmap_skills")
    .select("id, display_name, sort_order, color")
    .order("sort_order");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    displayName: row.display_name,
    sortOrder: row.sort_order,
    color: row.color,
  }));
}

async function fetchRoadmapInternalIds(
  supabase: AdminClient,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("roadmap_items")
    .select("internal_id");

  if (error) throw error;
  return new Set((data ?? []).map((row) => row.internal_id));
}

export async function fetchBrowseLayerCounts(
  supabase: AdminClient,
  skillId: string,
): Promise<BrowseLayerSummary[]> {
  const [curatedResult, roadmapIds] = await Promise.all([
    supabase
      .from("roadmap_items")
      .select("layer")
      .eq("skill_id", skillId),
    fetchRoadmapInternalIds(supabase),
  ]);

  if (curatedResult.error) throw curatedResult.error;

  const curatedByLayer = new Map<number, number>();
  for (const row of curatedResult.data ?? []) {
    curatedByLayer.set(row.layer, (curatedByLayer.get(row.layer) ?? 0) + 1);
  }

  const tiersUnion = [...new Set([1, 2, 3, 4, 5].flatMap(tiersForLayer))];
  const categoryFilter = buildCategoryOrFilter(skillId);

  let inferredCandidates: ItemRow[] = [];

  if (categoryFilter) {
    const { data, error } = await supabase
      .from("items")
      .select("internal_id, display_name, tier, category")
      .in("tier", tiersUnion)
      .or(categoryFilter)
      .order("display_name")
      .limit(3000);

    if (error) throw error;
    inferredCandidates = (data ?? []) as ItemRow[];
  }

  const inferredByLayer = new Map<number, number>();
  for (const item of inferredCandidates) {
    if (roadmapIds.has(item.internal_id)) continue;
    if (!itemMatchesSkill(skillId, item.category, item.internal_id)) continue;

    const layer = tierToLayer(item.tier);
    inferredByLayer.set(layer, (inferredByLayer.get(layer) ?? 0) + 1);
  }

  return [1, 2, 3, 4, 5].map((layer) => {
    const curatedCount = curatedByLayer.get(layer) ?? 0;
    const inferredCount = inferredByLayer.get(layer) ?? 0;
    return {
      layer,
      label: layerLabel(layer),
      curatedCount,
      inferredCount,
      totalCount: curatedCount + inferredCount,
    };
  });
}

export async function fetchBrowseItems(
  supabase: AdminClient,
  skillId: string,
  layer: number,
  inferredOffset: number,
  inferredLimit = INFERRED_PAGE_SIZE,
): Promise<{
  curated: BrowseItem[];
  inferred: BrowseItem[];
  inferredTotal: number;
  hasMoreInferred: boolean;
}> {
  const [curatedResult, roadmapIds] = await Promise.all([
    supabase
      .from("roadmap_items")
      .select(
        `
        internal_id,
        sort_order,
        label_override,
        items!inner (
          internal_id,
          display_name,
          tier,
          category
        )
      `,
      )
      .eq("skill_id", skillId)
      .eq("layer", layer)
      .order("sort_order"),
    fetchRoadmapInternalIds(supabase),
  ]);

  if (curatedResult.error) throw curatedResult.error;

  const curated = (curatedResult.data ?? [])
    .map((row) => mapCuratedRow(row as unknown as CuratedRow))
    .filter((item): item is BrowseItem => item !== null);

  const tiers = tiersForLayer(layer);
  const categoryFilter = buildCategoryOrFilter(skillId);

  if (!categoryFilter) {
    return {
      curated,
      inferred: [],
      inferredTotal: 0,
      hasMoreInferred: false,
    };
  }

  const { data, error } = await supabase
    .from("items")
    .select("internal_id, display_name, tier, category")
    .in("tier", tiers)
    .or(categoryFilter)
    .order("display_name")
    .limit(3000);

  if (error) throw error;

  const inferredAll = ((data ?? []) as ItemRow[])
    .filter(
      (item) =>
        !roadmapIds.has(item.internal_id) &&
        itemMatchesSkill(skillId, item.category, item.internal_id),
    )
    .map(mapInferredRow);

  const inferredTotal = inferredAll.length;
  const inferred = inferredAll.slice(
    inferredOffset,
    inferredOffset + inferredLimit,
  );
  const hasMoreInferred = inferredOffset + inferred.length < inferredTotal;

  return { curated, inferred, inferredTotal, hasMoreInferred };
}

export { INFERRED_PAGE_SIZE };
