import dagre from "@dagrejs/dagre";
import type { ItemFlowNode, RecipeFlowEdge } from "./types";

/** Estimated ItemNode dimensions for dagre (px). */
export const ITEM_NODE_WIDTH = 200;
export const ITEM_NODE_HEIGHT = 72;

export interface DagreLayoutOptions {
  rankdir?: "TB" | "BT" | "LR" | "RL";
  nodesep?: number;
  ranksep?: number;
}

const DEFAULT_OPTIONS: Required<DagreLayoutOptions> = {
  rankdir: "TB",
  nodesep: 48,
  ranksep: 88,
};

/**
 * Top-down layout: target (craft result) above ingredients.
 * Domain edges are ingredient → result; dagre uses result → ingredient.
 */
export function layoutWithDagre(
  nodes: ItemFlowNode[],
  edges: RecipeFlowEdge[],
  options: DagreLayoutOptions = {},
): ItemFlowNode[] {
  if (nodes.length === 0) return nodes;

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: opts.rankdir,
    nodesep: opts.nodesep,
    ranksep: opts.ranksep,
  });

  for (const node of nodes) {
    g.setNode(node.id, { width: ITEM_NODE_WIDTH, height: ITEM_NODE_HEIGHT });
  }

  const seenPairs = new Set<string>();
  for (const edge of edges) {
    const key = `${edge.target}\u0000${edge.source}`;
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);
    g.setEdge(edge.target, edge.source);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const layoutNode = g.node(node.id);
    if (!layoutNode) {
      return node;
    }
    return {
      ...node,
      position: {
        x: layoutNode.x - ITEM_NODE_WIDTH / 2,
        y: layoutNode.y - ITEM_NODE_HEIGHT / 2,
      },
    };
  });
}
