"use client";

import { useGraphStore } from "@/stores/graph-store";

export interface GraphToolbarProps {
  className?: string;
}

export function GraphToolbar({ className }: GraphToolbarProps) {
  const expandBases = useGraphStore((s) => s.expandBases);
  const setExpandBases = useGraphStore((s) => s.setExpandBases);
  const targetInternalId = useGraphStore((s) => s.targetInternalId);
  const isLoading = useGraphStore((s) => s.isLoading);
  const meta = useGraphStore((s) => s.meta);

  const disabled = !targetInternalId || isLoading;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className ?? ""}`}
    >
      <label
        className={[
          "flex cursor-pointer select-none items-center gap-2 text-sm text-zinc-300",
          disabled ? "cursor-not-allowed opacity-50" : "",
        ].join(" ")}
      >
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-amber-500 focus:ring-amber-500/50"
          checked={expandBases}
          disabled={disabled}
          onChange={(e) => setExpandBases(e.target.checked)}
        />
        Expand enchanted bases
      </label>

      {meta && targetInternalId ? (
        <span className="text-xs text-zinc-500">
          {meta.nodeCount} nodes · {meta.edgeCount} edges
        </span>
      ) : null}
    </div>
  );
}
