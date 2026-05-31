"use client";

import { useEffect, useRef } from "react";
import type { BrowseItem } from "@/lib/browse/types";
import { tierBadgeClass } from "@/lib/items/tier-styles";
import { useDashboardStore } from "@/stores/dashboard-store";

interface LayerItemsState {
  curated: BrowseItem[];
  inferred: BrowseItem[];
  inferredOffset: number;
  hasMoreInferred: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

function BrowseItemButton({
  item,
  isSelected,
  onSelect,
  skillColor,
}: {
  item: BrowseItem;
  isSelected: boolean;
  onSelect: () => void;
  skillColor?: string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={[
          "flex w-full flex-col gap-0.5 rounded px-2 py-1.5 text-left text-xs transition-colors duration-150",
          isSelected ? "sc-list-row-selected" : "text-white/70 hover:bg-white/5 hover:text-white",
        ].join(" ")}
        style={
          isSelected && skillColor
            ? { boxShadow: `inset 3px 0 0 ${skillColor}` }
            : undefined
        }
        aria-current={isSelected ? "true" : undefined}
      >
        <span className="truncate font-medium">{item.mapLabel}</span>
        {item.tier ? (
          <span className={`font-mono text-[10px] ${tierBadgeClass(item.tier)}`}>
            {item.tier}
          </span>
        ) : null}
      </button>
    </li>
  );
}

function LayerItemList({
  skillId,
  layer,
  state,
  onLoadMore,
  skillColor,
}: {
  skillId: string;
  layer: number;
  state: LayerItemsState | undefined;
  onLoadMore: (skillId: string, layer: number) => void;
  skillColor?: string;
}) {
  const selectedInternalId = useDashboardStore((s) => s.selectedInternalId);
  const selectItem = useDashboardStore((s) => s.selectItem);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !state?.hasMoreInferred || state.isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore(skillId, layer);
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [skillId, layer, state?.hasMoreInferred, state?.isLoadingMore, onLoadMore]);

  if (!state || state.isLoading) {
    return <p className="px-2 py-2 text-[11px] text-white/55">Loading items…</p>;
  }

  if (state.error) {
    return (
      <p className="px-2 py-2 text-[11px] text-red-400" role="alert">
        {state.error}
      </p>
    );
  }

  if (state.curated.length === 0 && state.inferred.length === 0) {
    return <p className="px-2 py-2 text-[11px] text-white/55">No items</p>;
  }

  return (
    <>
      <ul className="ml-2 max-h-72 overflow-y-auto border-l border-white/10 pl-2">
        {state.curated.length > 0 ? (
          <>
            <li className="px-2 py-1 text-[10px] uppercase tracking-wide text-sc-link/70">
              Milestones
            </li>
            {state.curated.map((item) => (
              <BrowseItemButton
                key={item.internalId}
                item={item}
                isSelected={selectedInternalId === item.internalId}
                onSelect={() => selectItem(item.internalId)}
                skillColor={skillColor}
              />
            ))}
          </>
        ) : null}

        {state.inferred.length > 0 ? (
          <>
            <li className="mt-1 px-2 py-1 text-[10px] uppercase tracking-wide text-sc-link/70">
              All items
            </li>
            {state.inferred.map((item) => (
              <BrowseItemButton
                key={item.internalId}
                item={item}
                isSelected={selectedInternalId === item.internalId}
                onSelect={() => selectItem(item.internalId)}
                skillColor={skillColor}
              />
            ))}
          </>
        ) : null}

        {state.isLoadingMore ? (
          <li className="px-2 py-2 text-[11px] text-white/55">Loading more…</li>
        ) : null}
      </ul>
      <div ref={sentinelRef} className="h-1" aria-hidden />
    </>
  );
}

export { LayerItemList };
export type { LayerItemsState };
