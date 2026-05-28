"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ItemFlowNode } from "@/lib/graph/types";

const TIER_STYLES: Record<string, string> = {
  COMMON: "border-zinc-400/60 bg-zinc-50 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100",
  UNCOMMON: "border-emerald-500/70 bg-emerald-950/20 text-emerald-100",
  RARE: "border-sky-500/70 bg-sky-950/25 text-sky-100",
  EPIC: "border-violet-500/70 bg-violet-950/25 text-violet-100",
  LEGENDARY: "border-amber-500/80 bg-amber-950/25 text-amber-100",
  MYTHIC: "border-fuchsia-500/80 bg-fuchsia-950/30 text-fuchsia-100",
  DIVINE: "border-cyan-400/80 bg-cyan-950/30 text-cyan-100",
  SPECIAL: "border-rose-500/70 bg-rose-950/25 text-rose-100",
  VERY_SPECIAL: "border-orange-500/70 bg-orange-950/25 text-orange-100",
};

function tierClass(tier: string | null | undefined): string {
  if (!tier) {
    return "border-zinc-500/50 bg-zinc-900/80 text-zinc-100";
  }
  return TIER_STYLES[tier] ?? TIER_STYLES.COMMON;
}

function ItemNodeComponent({ data, selected }: NodeProps<ItemFlowNode>) {
  const isTarget = data.depth === 0;

  return (
    <div
      className={[
        "relative min-w-[180px] max-w-[220px] rounded-lg border-2 px-3 py-2 shadow-md transition-shadow",
        tierClass(data.tier),
        isTarget ? "ring-2 ring-amber-400/90 ring-offset-2 ring-offset-zinc-950" : "",
        selected ? "shadow-lg shadow-amber-500/20" : "",
      ].join(" ")}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-zinc-400 !bg-zinc-200"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-zinc-400 !bg-zinc-200"
      />

      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold leading-tight">{data.label}</p>
        <p className="font-mono text-[10px] uppercase tracking-wide text-zinc-400">
          {data.internalId}
        </p>
        {data.tier ? (
          <span className="text-[10px] font-medium uppercase opacity-80">
            {data.tier}
          </span>
        ) : null}
        {data.isLeafPruned ? (
          <span
            className="mt-0.5 rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] leading-snug text-violet-200"
            title="Enchanted leaf — expand bases for full tree"
          >
            Enchanted leaf — expand bases for full tree
          </span>
        ) : null}
      </div>
    </div>
  );
}

export const ItemNode = memo(ItemNodeComponent);
