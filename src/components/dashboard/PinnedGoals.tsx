"use client";

import { ItemIcon } from "@/components/items/ItemIcon";
import { MAX_PINNED_GOALS } from "@/lib/dashboard/constants";
import { tierBadgeClass, tierBorderClass } from "@/lib/items/tier-styles";
import { SkyCryptPanel } from "@/components/layout/SkyCryptPanel";
import { useDashboardStore } from "@/stores/dashboard-store";

export function PinnedGoals({ className = "" }: { className?: string }) {
  const goals = useDashboardStore((s) => s.goals);
  const goalsSource = useDashboardStore((s) => s.goalsSource);
  const goalsError = useDashboardStore((s) => s.goalsError);
  const isGoalsLoading = useDashboardStore((s) => s.isGoalsLoading);
  const unpinGoal = useDashboardStore((s) => s.unpinGoal);
  const selectItem = useDashboardStore((s) => s.selectItem);
  const selectedInternalId = useDashboardStore((s) => s.selectedInternalId);

  return (
    <SkyCryptPanel
      title="Pinned goals"
      accent="green"
      className={className}
      action={
        <span className="sc-chip sc-chip-teal font-normal">
          {goals.length}/{MAX_PINNED_GOALS}
        </span>
      }
    >
      <p className="mb-3 text-xs text-white/65">
        Pin up to {MAX_PINNED_GOALS} end items via search.
        {goalsSource === "local" ? " Saved locally until you sign in." : ""}
      </p>

      {isGoalsLoading ? <p className="text-sm text-white/50">Loading goals…</p> : null}
      {goalsError ? (
        <p className="mb-3 text-sm text-red-400" role="alert">
          {goalsError}
        </p>
      ) : null}

      {goals.length === 0 && !isGoalsLoading ? (
        <div className="sc-empty-state">
          <p className="text-sm font-medium text-white/75">No goals pinned yet</p>
          <p className="mt-1.5 text-xs text-white/55">
            Search for Hyperion and choose &ldquo;Pin as goal&rdquo;.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-2">
          {goals.map((goal) => {
            const isSelected = selectedInternalId === goal.internalId;
            return (
              <li key={goal.id} className="min-w-0">
                <article
                  className={[
                    "sc-list-row min-w-0 overflow-hidden !gap-2 !p-2",
                    tierBorderClass(goal.tier),
                    isSelected ? "sc-list-row-selected" : "",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => selectItem(goal.internalId)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden text-left"
                  >
                    <ItemIcon
                      internalId={goal.internalId}
                      displayName={goal.displayName}
                      tier={goal.tier}
                      size={40}
                      className="shrink-0"
                    />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate text-sm font-semibold text-white">
                        {goal.displayName}
                      </p>
                      <p className="mt-0.5 flex min-w-0 items-center gap-1.5 overflow-hidden font-mono text-[10px] text-white/55">
                        <span className="min-w-0 truncate">{goal.internalId}</span>
                        {goal.tier ? (
                          <span className={`shrink-0 ${tierBadgeClass(goal.tier)}`}>
                            {goal.tier}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => void unpinGoal(goal.id)}
                    className="sc-btn-ghost shrink-0 px-2 text-xs"
                    aria-label={`Remove ${goal.displayName} from goals`}
                  >
                    Remove
                  </button>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </SkyCryptPanel>
  );
}
