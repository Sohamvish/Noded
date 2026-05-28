import { create } from "zustand";
import type {
  GraphMeta,
  ItemFlowNode,
  ReactFlowGraphPayload,
  RecipeFlowEdge,
} from "@/lib/graph/types";

interface GraphState {
  targetInternalId: string | null;
  expandBases: boolean;
  nodes: ItemFlowNode[];
  edges: RecipeFlowEdge[];
  meta: GraphMeta | null;
  isLoading: boolean;
  error: string | null;

  setTarget: (internalId: string) => Promise<void>;
  setExpandBases: (value: boolean) => void;
  fetchGraph: () => Promise<void>;
  clearGraph: () => void;
}

let fetchAbort: AbortController | null = null;

function normalizeTargetId(internalId: string): string {
  return internalId.trim().toUpperCase();
}

export const useGraphStore = create<GraphState>((set, get) => ({
  targetInternalId: null,
  expandBases: false,
  nodes: [],
  edges: [],
  meta: null,
  isLoading: false,
  error: null,

  setTarget: async (internalId) => {
    const targetInternalId = normalizeTargetId(internalId);
    if (!targetInternalId) return;

    set({ targetInternalId, error: null });
    await get().fetchGraph();
  },

  setExpandBases: (value) => {
    set({ expandBases: value });
    const { targetInternalId } = get();
    if (targetInternalId) {
      void get().fetchGraph();
    }
  },

  fetchGraph: async () => {
    const { targetInternalId, expandBases } = get();

    if (!targetInternalId) {
      set({
        nodes: [],
        edges: [],
        meta: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    fetchAbort?.abort();
    const controller = new AbortController();
    fetchAbort = controller;

    set({ isLoading: true, error: null });

    const params = new URLSearchParams({
      target: targetInternalId,
      expandBases: String(expandBases),
    });

    try {
      const res = await fetch(`/api/graph?${params}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed to load graph (${res.status})`);
      }

      const payload = (await res.json()) as ReactFlowGraphPayload;

      if (controller.signal.aborted) return;

      set({
        nodes: payload.nodes,
        edges: payload.edges,
        meta: payload.meta,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      if (controller.signal.aborted) return;

      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load graph",
        nodes: [],
        edges: [],
        meta: null,
      });
    }
  },

  clearGraph: () => {
    fetchAbort?.abort();
    fetchAbort = null;
    set({
      targetInternalId: null,
      expandBases: false,
      nodes: [],
      edges: [],
      meta: null,
      isLoading: false,
      error: null,
    });
  },
}));
