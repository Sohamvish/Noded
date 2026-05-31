"use client";

import { LayerItemList } from "@/components/dashboard/LayerItemList";
import { useBrowseNav } from "@/hooks/useBrowseNav";

export function CategoryNav() {
  const {
    skills,
    skillsLoading,
    skillsError,
    expandedSkills,
    expandedLayers,
    skillCounts,
    layerItems,
    toggleSkill,
    toggleLayer,
    loadMoreInferred,
  } = useBrowseNav();

  if (skillsLoading) {
    return <p className="px-3 py-4 text-sm text-white/65">Loading categories…</p>;
  }

  if (skillsError) {
    return (
      <p className="px-3 py-4 text-sm text-red-400" role="alert">
        {skillsError}
      </p>
    );
  }

  if (skills.length === 0) {
    return (
      <p className="px-3 py-4 text-sm text-white/65">
        No categories loaded. Run the roadmap seed script.
      </p>
    );
  }

  return (
    <nav aria-label="Progression categories" className="py-2">
      <ul className="space-y-1">
        {skills.map((skill) => {
          const skillExpanded = expandedSkills.has(skill.id);
          const counts = skillCounts[skill.id];
          const skillColor = skill.color ?? "#71717a";

          return (
            <li key={skill.id}>
              <button
                type="button"
                onClick={() => toggleSkill(skill.id)}
                className={[
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors duration-150",
                  skillExpanded
                    ? "text-white"
                    : "text-white/80 hover:bg-white/5 hover:text-white",
                ].join(" ")}
                style={
                  skillExpanded
                    ? {
                        background: `linear-gradient(90deg, color-mix(in srgb, ${skillColor} 18%, transparent), transparent)`,
                        boxShadow: `inset 3px 0 0 ${skillColor}`,
                      }
                    : undefined
                }
                aria-expanded={skillExpanded}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/15"
                  style={{ backgroundColor: skillColor }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{skill.displayName}</span>
                <span
                  className="text-xs tabular-nums"
                  style={{ color: skillExpanded ? skillColor : "var(--sc-icon)" }}
                >
                  {skillExpanded ? "−" : "+"}
                </span>
              </button>

              {skillExpanded ? (
                <ul
                  className="ml-3 border-l pl-2"
                  style={{ borderColor: `${skillColor}33` }}
                >
                  {counts?.isLoading ? (
                    <li className="px-2 py-2 text-[11px] text-white/55">Loading layers…</li>
                  ) : null}
                  {counts?.error ? (
                    <li className="px-2 py-2 text-[11px] text-red-400">{counts.error}</li>
                  ) : null}
                  {(counts?.layers ?? [])
                    .filter((layer) => layer.totalCount > 0)
                    .map((layerSummary) => {
                      const layerKey = `${skill.id}:${layerSummary.layer}`;
                      const layerExpanded = expandedLayers.has(layerKey);

                      return (
                        <li key={layerKey}>
                          <button
                            type="button"
                            onClick={() => toggleLayer(skill.id, layerSummary.layer)}
                            className={[
                              "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors duration-150",
                              layerExpanded
                                ? "bg-white/5 text-white/90"
                                : "text-white/55 hover:bg-white/5 hover:text-white/85",
                            ].join(" ")}
                            aria-expanded={layerExpanded}
                          >
                            <span>{layerSummary.label}</span>
                            <span className="sc-chip text-[10px] tabular-nums">
                              {layerExpanded ? "−" : "+"} {layerSummary.totalCount}
                            </span>
                          </button>

                          {layerExpanded ? (
                            <LayerItemList
                              skillId={skill.id}
                              layer={layerSummary.layer}
                              state={layerItems[layerKey]}
                              onLoadMore={loadMoreInferred}
                              skillColor={skillColor}
                            />
                          ) : null}
                        </li>
                      );
                    })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
