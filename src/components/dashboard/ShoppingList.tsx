"use client";

import { useEffect, useState } from "react";
import { ItemIcon } from "@/components/items/ItemIcon";
import { ItemTooltip } from "@/components/items/ItemTooltip";
import { SkyCryptPanel } from "@/components/layout/SkyCryptPanel";
import { SkyCryptProgressBar } from "@/components/layout/SkyCryptProgressBar";
import type { MaterialsApiResponse } from "@/lib/items/types";
import { tierBadgeClass } from "@/lib/items/tier-styles";
import { useDashboardStore } from "@/stores/dashboard-store";

function formatQty(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function ShoppingList({ className = "" }: { className?: string }) {
  const goals = useDashboardStore((s) => s.goals);
  const expandBases = useDashboardStore((s) => s.expandBases);
  const setExpandBases = useDashboardStore((s) => s.setExpandBases);
  const selectItem = useDashboardStore((s) => s.selectItem);

  const [data, setData] = useState<MaterialsApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goalIds = goals.map((g) => g.internalId).join(",");

  useEffect(() => {
    if (goals.length === 0) {
      setData(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      targets: goalIds,
      expandBases: String(expandBases),
    });

    fetch(`/api/materials?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Failed to load materials (${res.status})`);
        }
        return res.json() as Promise<MaterialsApiResponse>;
      })
      .then((body) => setData(body))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setData(null);
        setError(err instanceof Error ? err.message : "Failed to load materials");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [goalIds, expandBases, goals.length]);

  if (goals.length === 0) {
    return (
      <SkyCryptPanel title="Shopping list" accent="pink" className={className}>
        <div className="sc-empty-state">
          <p className="text-sm text-white/60">
            Pin at least one goal to generate your aggregated material list.
          </p>
        </div>
      </SkyCryptPanel>
    );
  }

  return (
    <SkyCryptPanel
      title="Shopping list"
      accent="pink"
      className={className}
      action={
        <label className="flex cursor-pointer items-center gap-2 text-xs text-white/65">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-white/20 bg-black/40 text-sc-icon accent-sc-icon"
            checked={expandBases}
            onChange={(e) => setExpandBases(e.target.checked)}
          />
          Expand enchanted bases
        </label>
      }
    >
      {isLoading ? <p className="text-sm text-white/50">Calculating materials…</p> : null}
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {data?.disclaimer ? (
        <p className="mb-3 text-[10px] text-white/55">{data.disclaimer}</p>
      ) : null}

      {data && data.lines.length === 0 && !isLoading ? (
        <p className="text-sm text-white/50">No craft materials found for pinned goals.</p>
      ) : null}

      {data && data.lines.length > 0 ? (
        <ul className="space-y-2">
          {data.lines.map((line) => {
            const complete = line.progressPct === 100;
            const showProgress = line.ownedQty != null && line.progressPct != null;

            return (
              <li key={line.internalId}>
                <button
                  type="button"
                  onClick={() => selectItem(line.internalId)}
                  className={[
                    "sc-list-row",
                    complete ? "sc-list-row-complete" : "",
                  ].join(" ")}
                >
                  <ItemTooltip item={line}>
                    <ItemIcon
                      internalId={line.internalId}
                      displayName={line.displayName}
                      tier={line.tier}
                      iconUrl={line.iconUrl}
                      size={36}
                    />
                  </ItemTooltip>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-white">
                        {line.displayName}
                      </span>
                      <span className="sc-stat shrink-0 text-xs text-sc-link">
                        {formatQty(line.requiredQty)}
                        {line.ownedQty != null ? (
                          <span className="font-normal text-white/55">
                            {" "}
                            / {formatQty(Math.min(line.ownedQty, line.requiredQty))}
                          </span>
                        ) : null}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {line.tier ? (
                        <span className={`font-mono text-[10px] ${tierBadgeClass(line.tier)}`}>
                          {line.tier}
                        </span>
                      ) : null}
                      {line.source === "terminal" ? (
                        <span className="sc-chip text-[10px]">
                          {line.hint ?? "Drop / slayer"}
                        </span>
                      ) : null}
                    </div>

                    {showProgress ? (
                      <SkyCryptProgressBar
                        value={line.progressPct ?? 0}
                        maxed={complete}
                        className="mt-1.5"
                      />
                    ) : (
                      <p className="mt-1 text-[10px] text-white/55">
                        Sign in & sync to track progress
                      </p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </SkyCryptPanel>
  );
}
