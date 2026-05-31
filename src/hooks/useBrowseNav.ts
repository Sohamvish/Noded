"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  BrowseItem,
  BrowseLayerSummary,
  BrowseSkill,
} from "@/lib/browse/types";

interface LayerItemsState {
  curated: BrowseItem[];
  inferred: BrowseItem[];
  inferredOffset: number;
  hasMoreInferred: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

interface SkillCountsState {
  layers: BrowseLayerSummary[];
  isLoading: boolean;
  error: string | null;
}

function emptyLayerState(): LayerItemsState {
  return {
    curated: [],
    inferred: [],
    inferredOffset: 0,
    hasMoreInferred: false,
    isLoading: false,
    isLoadingMore: false,
    error: null,
  };
}

export function useBrowseNav() {
  const [skills, setSkills] = useState<BrowseSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(
    () => new Set(),
  );

  const [skillCounts, setSkillCounts] = useState<
    Record<string, SkillCountsState>
  >({});
  const [layerItems, setLayerItems] = useState<
    Record<string, LayerItemsState>
  >({});

  const layerItemsRef = useRef(layerItems);
  layerItemsRef.current = layerItems;

  useEffect(() => {
    setSkillsLoading(true);
    fetch("/api/browse/skills")
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? `Failed to load skills (${res.status})`);
        }
        return res.json() as Promise<{ skills: BrowseSkill[] }>;
      })
      .then((data) => {
        setSkills(data.skills);
        setSkillsError(null);
      })
      .catch((err: unknown) => {
        setSkillsError(
          err instanceof Error ? err.message : "Failed to load skills",
        );
      })
      .finally(() => setSkillsLoading(false));
  }, []);

  const loadSkillCounts = useCallback(async (skillId: string) => {
    setSkillCounts((prev) => ({
      ...prev,
      [skillId]: {
        layers: prev[skillId]?.layers ?? [],
        isLoading: true,
        error: null,
      },
    }));

    try {
      const res = await fetch(
        `/api/browse/counts?skillId=${encodeURIComponent(skillId)}`,
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed to load counts (${res.status})`);
      }
      const data = (await res.json()) as { layers: BrowseLayerSummary[] };
      setSkillCounts((prev) => ({
        ...prev,
        [skillId]: { layers: data.layers, isLoading: false, error: null },
      }));
    } catch (err) {
      setSkillCounts((prev) => ({
        ...prev,
        [skillId]: {
          layers: prev[skillId]?.layers ?? [],
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load counts",
        },
      }));
    }
  }, []);

  const loadLayerItems = useCallback(
    async (skillId: string, layer: number, append = false) => {
      const key = `${skillId}:${layer}`;
      const current = layerItemsRef.current[key] ?? emptyLayerState();
      const inferredOffset = append ? current.inferred.length : 0;

      setLayerItems((prev) => ({
        ...prev,
        [key]: {
          ...current,
          isLoading: !append,
          isLoadingMore: append,
          error: null,
        },
      }));

      try {
        const params = new URLSearchParams({
          skillId,
          layer: String(layer),
          offset: String(inferredOffset),
        });
        const res = await fetch(`/api/browse/items?${params}`);
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? `Failed to load items (${res.status})`);
        }
        const data = (await res.json()) as {
          curated: BrowseItem[];
          inferred: BrowseItem[];
          hasMoreInferred: boolean;
        };

        setLayerItems((prev) => {
          const existing = prev[key] ?? emptyLayerState();
          return {
            ...prev,
            [key]: {
              curated: append ? existing.curated : data.curated,
              inferred: append
                ? [...existing.inferred, ...data.inferred]
                : data.inferred,
              inferredOffset: append
                ? existing.inferred.length + data.inferred.length
                : data.inferred.length,
              hasMoreInferred: data.hasMoreInferred,
              isLoading: false,
              isLoadingMore: false,
              error: null,
            },
          };
        });
      } catch (err) {
        setLayerItems((prev) => ({
          ...prev,
          [key]: {
            ...(prev[key] ?? emptyLayerState()),
            isLoading: false,
            isLoadingMore: false,
            error: err instanceof Error ? err.message : "Failed to load items",
          },
        }));
      }
    },
    [],
  );

  const toggleSkill = useCallback(
    (skillId: string) => {
      setExpandedSkills((prev) => {
        const next = new Set(prev);
        const willExpand = !next.has(skillId);
        if (willExpand) {
          next.add(skillId);
          if (!skillCounts[skillId]?.layers.length) {
            void loadSkillCounts(skillId);
          }
        } else {
          next.delete(skillId);
        }
        return next;
      });
    },
    [loadSkillCounts, skillCounts],
  );

  const toggleLayer = useCallback(
    (skillId: string, layer: number) => {
      const key = `${skillId}:${layer}`;
      setExpandedLayers((prev) => {
        const next = new Set(prev);
        const willExpand = !next.has(key);
        if (willExpand) {
          next.add(key);
          const existing = layerItemsRef.current[key];
          const needsLoad =
            !existing ||
            (existing.curated.length === 0 &&
              existing.inferred.length === 0 &&
              !existing.isLoading &&
              !existing.error);
          if (needsLoad) {
            void loadLayerItems(skillId, layer);
          }
        } else {
          next.delete(key);
        }
        return next;
      });
    },
    [loadLayerItems],
  );

  const loadMoreInferred = useCallback(
    (skillId: string, layer: number) => {
      const key = `${skillId}:${layer}`;
      const state = layerItemsRef.current[key];
      if (!state || state.isLoadingMore || !state.hasMoreInferred) return;
      void loadLayerItems(skillId, layer, true);
    },
    [loadLayerItems],
  );

  return {
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
  };
}
