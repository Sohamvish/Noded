import type { GraphEdge } from "./types";

const PAIR_KEY_SEP = "\u0000";

function pairKey(source: string, target: string): string {
  return `${source}${PAIR_KEY_SEP}${target}`;
}

/**
 * Assigns parallelIndex per (source, target) group so React Flow can offset
 * multiple recipe paths between the same item pair.
 */
export function assignParallelEdgeIndices(edges: GraphEdge[]): GraphEdge[] {
  const groups = new Map<string, GraphEdge[]>();

  for (const edge of edges) {
    const key = pairKey(edge.source, edge.target);
    const group = groups.get(key);
    if (group) {
      group.push(edge);
    } else {
      groups.set(key, [edge]);
    }
  }

  const indexed: GraphEdge[] = [];

  for (const group of groups.values()) {
    group.sort((a, b) => a.recipeId.localeCompare(b.recipeId));
    group.forEach((edge, parallelIndex) => {
      indexed.push({ ...edge, parallelIndex });
    });
  }

  return indexed;
}

export function parallelCountForEdge(
  edges: GraphEdge[],
  source: string,
  target: string,
): number {
  return edges.filter((e) => e.source === source && e.target === target).length;
}
