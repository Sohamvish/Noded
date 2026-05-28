import type { GraphEdge, GraphNode, ItemFlowNode, ReactFlowGraphPayload, RecipeFlowEdge } from "./types";
import { assignParallelEdgeIndices, parallelCountForEdge } from "./parallel-edge-offset";

const PARALLEL_OFFSET_PX = 24;

function abbreviateRecipeType(type: string): string {
  return type === "forge" ? "forge" : "craft";
}

export function graphToReactFlow(
  nodes: GraphNode[],
  edges: GraphEdge[],
  meta: ReactFlowGraphPayload["meta"],
): ReactFlowGraphPayload {
  const indexedEdges = assignParallelEdgeIndices(edges);

  const flowNodes: ItemFlowNode[] = nodes.map((node) => ({
    id: node.id,
    type: "item",
    position: { x: 0, y: 0 },
    data: {
      internalId: node.internalId,
      label: node.label,
      depth: node.depth,
      tier: node.tier,
      isLeafPruned: node.isLeafPruned,
    },
  }));

  const flowEdges: RecipeFlowEdge[] = indexedEdges.map((edge) => {
    const parallelIndex = edge.parallelIndex ?? 0;
    const parallelCount = parallelCountForEdge(indexedEdges, edge.source, edge.target);
    const showLabel = parallelIndex === 0;

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      label: showLabel
        ? `${edge.quantity}× ${abbreviateRecipeType(edge.recipeType)}`
        : undefined,
      labelStyle: { fontSize: 10 },
      pathOptions: {
        offset: (parallelIndex - (parallelCount - 1) / 2) * PARALLEL_OFFSET_PX,
      },
      data: {
        quantity: edge.quantity,
        recipeId: edge.recipeId,
        recipeType: edge.recipeType,
        parallelIndex,
        parallelCount,
        showLabel,
      },
    };
  });

  return { nodes: flowNodes, edges: flowEdges, meta };
}
