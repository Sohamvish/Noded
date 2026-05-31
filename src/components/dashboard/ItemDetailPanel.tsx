"use client";

import { useEffect, useState } from "react";
import { ItemIcon } from "@/components/items/ItemIcon";
import { MinecraftText } from "@/components/items/MinecraftText";
import type { ItemDetailApiResponse } from "@/lib/items/types";
import { tierBadgeClass, tierBorderClass } from "@/lib/items/tier-styles";
import { useDashboardStore } from "@/stores/dashboard-store";

function formatDuration(seconds: number | null): string | null {
  if (seconds == null || seconds <= 0) return null;
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export interface ItemDetailPanelProps {
  embedded?: boolean;
  /** When embedded with no selection, show placeholder instead of rendering nothing. */
  showEmptyPlaceholder?: boolean;
}

export function ItemDetailPanel({
  embedded = false,
  showEmptyPlaceholder = false,
}: ItemDetailPanelProps) {
  const selectedInternalId = useDashboardStore((s) => s.selectedInternalId);
  const clearSelection = useDashboardStore((s) => s.clearSelection);
  const pinGoal = useDashboardStore((s) => s.pinGoal);
  const goals = useDashboardStore((s) => s.goals);

  const [detail, setDetail] = useState<ItemDetailApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPinned = selectedInternalId
    ? goals.some((g) => g.internalId === selectedInternalId)
    : false;

  useEffect(() => {
    if (!selectedInternalId) {
      setDetail(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetch(`/api/items/${encodeURIComponent(selectedInternalId)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Failed to load item (${res.status})`);
        }
        return res.json() as Promise<ItemDetailApiResponse>;
      })
      .then((data) => setDetail(data))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setDetail(null);
        setError(err instanceof Error ? err.message : "Failed to load item");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [selectedInternalId]);

  if (!selectedInternalId) {
    if (embedded && !showEmptyPlaceholder) return null;
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center px-4 py-10 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-sc-logo/25 bg-sc-logo/10 text-sc-logo">
          <span aria-hidden className="text-lg">
            ◈
          </span>
        </div>
        <p className="text-sm font-medium text-white/70">Select an item</p>
        <p className="mt-1 max-w-[14rem] text-xs text-white/40">
          Browse the roadmap or search to inspect recipes and materials.
        </p>
      </div>
    );
  }

  const tierBorder = detail?.tier ? tierBorderClass(detail.tier) : "border-sc-logo/20";

  return (
    <div className="flex min-h-0 flex-col">
      <header
        className={[
          "flex shrink-0 items-start justify-between gap-2 border-b border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm",
          tierBorder,
          detail?.tier ? "border-t-2" : "",
        ].join(" ")}
      >
        <div className="flex min-w-0 gap-3">
          {detail ? (
            <ItemIcon
              internalId={detail.internalId}
              displayName={detail.displayName}
              tier={detail.tier}
              iconUrl={detail.iconUrl}
              size={48}
            />
          ) : null}
          <div className="min-w-0">
            {isLoading ? (
              <p className="text-sm text-white/50">Loading…</p>
            ) : detail ? (
              <>
                <h2 className="text-base font-semibold leading-snug">
                  <MinecraftText text={detail.coloredName ?? detail.displayName} />
                </h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[10px] text-white/40">
                  {detail.internalId}
                  {detail.tier ? (
                    <span className={tierBadgeClass(detail.tier)}>{detail.tier}</span>
                  ) : null}
                  {detail.completed === true ? (
                    <span className="text-sc-link">Owned</span>
                  ) : detail.completed === false ? (
                    <span className="text-white/30">Not owned</span>
                  ) : null}
                </p>
              </>
            ) : (
              <p className="text-sm text-white/50">{selectedInternalId}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          {detail && !isPinned ? (
            <button type="button" onClick={() => void pinGoal({
              internalId: detail.internalId,
              displayName: detail.displayName,
              tier: detail.tier,
              category: detail.category,
            })} className="sc-btn text-xs">
              Pin goal
            </button>
          ) : null}
          <button
            type="button"
            onClick={clearSelection}
            className="sc-btn-ghost text-xs"
            aria-label="Close detail panel"
          >
            Close
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {error ? (
          <p className="text-sm text-red-400" role="alert">{error}</p>
        ) : null}

        {detail ? (
          <div className="space-y-4 text-sm">
            {detail.loreLines.length > 0 ? (
              <div className="sc-minecraft-tooltip rounded px-3 py-2">
                <ul className="space-y-0.5">
                  {detail.loreLines.map((line, index) => (
                    <li key={`${index}-${line.slice(0, 16)}`} className="text-[11px] leading-snug">
                      <MinecraftText text={line} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {detail.wikiUrl ? (
              <a
                href={detail.wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-sc-link hover:text-sc-hover"
              >
                Open wiki ↗
              </a>
            ) : null}

            {detail.slayerReq ? (
              <div>
                <h3 className="sc-section-label">Slayer requirement</h3>
                <p className="mt-1 text-white/80">{detail.slayerReq}</p>
              </div>
            ) : null}

            {detail.craftText ? (
              <div>
                <h3 className="sc-section-label">How to obtain</h3>
                <p className="mt-1 whitespace-pre-wrap text-white/80">{detail.craftText}</p>
              </div>
            ) : null}

            {detail.recipes.length > 0 ? (
              <div>
                <h3 className="sc-section-label">Recipes ({detail.recipes.length})</h3>
                <ul className="mt-2 space-y-3">
                  {detail.recipes.map((recipe) => {
                    const duration = formatDuration(recipe.durationSeconds);
                    return (
                      <li
                        key={recipe.id}
                        className="sc-panel-inset p-3"
                      >
                        <p className="text-xs text-white/50">
                          {recipe.type === "forge" ? "Forge" : "Craft"}
                          {recipe.resultCount > 1 ? ` · yields ${recipe.resultCount}` : ""}
                          {duration ? ` · ${duration}` : ""}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {recipe.ingredients.map((ing) => (
                            <li
                              key={`${recipe.id}-${ing.internalId}-${ing.slotPosition ?? "x"}`}
                              className="flex items-baseline justify-between gap-2 text-xs"
                            >
                              <span className="text-white/80">
                                {ing.quantity > 1 ? `${ing.quantity}× ` : ""}
                                {ing.displayName}
                              </span>
                              {ing.tier ? (
                                <span className={`shrink-0 font-mono text-[10px] ${tierBadgeClass(ing.tier)}`}>
                                  {ing.tier}
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-white/40">
                No craft recipes — likely a drop or shop item.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
