import type { Edge, Node } from "@xyflow/react";
import type { RecipeType } from "@/types/database";

/** Domain node before React Flow layout. */
export interface GraphNode {
  id: string;
  internalId: string;
  label: string;
  depth: number;
  tier?: string | null;
  isLeafPruned?: boolean;
}

/** Domain edge: ingredient (source) → result (target). */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  quantity: number;
  recipeId: string;
  recipeType: RecipeType;
  parallelIndex?: number;
}

export interface GraphMeta {
  targetInternalId: string;
  expandBases: boolean;
  nodeCount: number;
  edgeCount: number;
}

export interface GraphApiResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  meta: GraphMeta;
}

export interface ItemSearchResult {
  internalId: string;
  displayName: string;
  tier: string | null;
  category: string | null;
}

export interface ItemSearchApiResponse {
  results: ItemSearchResult[];
  query: string;
}

/** React Flow node/edge payloads after layout (positions added later). */
export type ItemFlowNode = Node<
  {
    internalId: string;
    label: string;
    depth: number;
    tier?: string | null;
    isLeafPruned?: boolean;
  },
  "item"
>;

export type RecipeFlowEdge = Edge<{
  quantity: number;
  recipeId: string;
  recipeType: RecipeType;
  parallelIndex: number;
  parallelCount: number;
  showLabel: boolean;
}>;

export interface ReactFlowGraphPayload {
  nodes: ItemFlowNode[];
  edges: RecipeFlowEdge[];
  meta: GraphMeta;
}
