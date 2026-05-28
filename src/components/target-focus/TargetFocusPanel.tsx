"use client";

import { GraphToolbar } from "@/components/graph/GraphToolbar";
import { ProgressionGraph } from "@/components/graph/ProgressionGraph";
import { ItemSearch } from "@/components/search/ItemSearch";
import { useGraphStore } from "@/stores/graph-store";

/**
 * Composes search, toolbar, and graph from the graph store.
 * Used by the app shell in phase 3.6.
 */
export function TargetFocusPanel() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const isLoading = useGraphStore((s) => s.isLoading);
  const error = useGraphStore((s) => s.error);
  const targetInternalId = useGraphStore((s) => s.targetInternalId);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 flex-col gap-3 border-b border-zinc-800 px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
        <ItemSearch className="w-full max-w-lg" />
        <GraphToolbar />
      </header>

      <div className="relative min-h-0 flex-1 p-4">
        {error ? (
          <div
            role="alert"
            className="mb-3 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-300"
          >
            {error}
          </div>
        ) : null}

        {isLoading && targetInternalId ? (
          <div className="pointer-events-none absolute inset-4 z-10 flex items-start justify-center pt-8">
            <span className="rounded-full bg-zinc-900/90 px-4 py-2 text-sm text-zinc-300 shadow-lg ring-1 ring-zinc-700">
              Loading craft tree…
            </span>
          </div>
        ) : null}

        <ProgressionGraph
          nodes={nodes}
          edges={edges}
          className={isLoading ? "opacity-60" : undefined}
        />
      </div>
    </div>
  );
}
