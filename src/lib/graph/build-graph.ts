import type { DependencySubgraphRow, RecipeType } from "@/types/database";
import type { GraphEdge, GraphNode } from "./types";

const ENCHANTED_PREFIX = /^ENCHANTED_/;

function edgeId(source: string, target: string, recipeId: string): string {
  return `${source}:${target}:${recipeId}`;
}

function isEnchantedLeaf(internalId: string): boolean {
  return ENCHANTED_PREFIX.test(internalId);
}

/**
 * Builds domain graph nodes/edges from RPC rows.
 * Edge direction: ingredient (source) → result (target).
 */
export function buildGraphFromSubgraphRows(
  rows: DependencySubgraphRow[],
  targetInternalId: string,
  expandBases: boolean,
  itemMeta: Map<
    string,
    { displayName: string; tier: string | null }
  >,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const depthById = new Map<string, number>();
  const edges: GraphEdge[] = [];

  depthById.set(targetInternalId, 0);

  for (const row of rows) {
    if (!row.ingredient_internal_id || !row.recipe_id || !row.recipe_type) {
      continue;
    }

    const source = row.ingredient_internal_id;
    const target = row.result_internal_id;
    const depth = row.depth;

    edges.push({
      id: edgeId(source, target, row.recipe_id),
      source,
      target,
      quantity: Number(row.quantity ?? 1),
      recipeId: row.recipe_id,
      recipeType: row.recipe_type as RecipeType,
    });

    const ingredientDepth = depth;
    const resultDepth = Math.max(0, depth - 1);

    const prevIng = depthById.get(source);
    if (prevIng === undefined || ingredientDepth < prevIng) {
      depthById.set(source, ingredientDepth);
    }

    const prevRes = depthById.get(target);
    if (prevRes === undefined || resultDepth < prevRes) {
      depthById.set(target, resultDepth);
    }
  }

  const nodeIds = new Set<string>(depthById.keys());
  for (const edge of edges) {
    nodeIds.add(edge.source);
    nodeIds.add(edge.target);
  }

  const outgoingByTarget = new Map<string, number>();
  for (const edge of edges) {
    outgoingByTarget.set(edge.target, (outgoingByTarget.get(edge.target) ?? 0) + 1);
  }

  const nodes: GraphNode[] = [...nodeIds].map((internalId) => {
    const meta = itemMeta.get(internalId);
    const hasExpansion = (outgoingByTarget.get(internalId) ?? 0) > 0;
    const isLeafPruned =
      !expandBases && isEnchantedLeaf(internalId) && !hasExpansion;

    return {
      id: internalId,
      internalId,
      label: meta?.displayName ?? internalId,
      depth: depthById.get(internalId) ?? 0,
      tier: meta?.tier ?? null,
      isLeafPruned,
    };
  });

  nodes.sort((a, b) => a.depth - b.depth || a.label.localeCompare(b.label));

  return { nodes, edges };
}
