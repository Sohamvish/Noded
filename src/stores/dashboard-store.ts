"use client";

import { create } from "zustand";
import {
  LOCAL_GOALS_STORAGE_KEY,
  MAX_PINNED_GOALS,
} from "@/lib/dashboard/constants";
import type { GoalItem, ItemSearchResult } from "@/lib/items/types";

interface StoredLocalGoal {
  id: string;
  internalId: string;
  displayName: string;
  tier: string | null;
  sortOrder: number;
}

interface DashboardState {
  goals: GoalItem[];
  goalsSource: "api" | "local" | null;
  selectedInternalId: string | null;
  expandBases: boolean;
  isGoalsLoading: boolean;
  goalsError: string | null;

  fetchGoals: () => Promise<void>;
  selectItem: (internalId: string) => void;
  clearSelection: () => void;
  pinGoal: (item: ItemSearchResult) => Promise<void>;
  unpinGoal: (goalId: string) => Promise<void>;
  setExpandBases: (value: boolean) => void;
}

function readLocalGoals(): StoredLocalGoal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_GOALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredLocalGoal[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalGoals(goals: StoredLocalGoal[]) {
  localStorage.setItem(LOCAL_GOALS_STORAGE_KEY, JSON.stringify(goals));
}

function toGoalItems(stored: StoredLocalGoal[]): GoalItem[] {
  return stored.map((goal) => ({
    id: goal.id,
    internalId: goal.internalId,
    displayName: goal.displayName,
    tier: goal.tier,
    sortOrder: goal.sortOrder,
  }));
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  goals: [],
  goalsSource: null,
  selectedInternalId: null,
  expandBases: false,
  isGoalsLoading: false,
  goalsError: null,

  fetchGoals: async () => {
    set({ isGoalsLoading: true, goalsError: null });
    try {
      const res = await fetch("/api/goals");
      if (res.status === 401) {
        const localGoals = toGoalItems(readLocalGoals());
        set({
          goals: localGoals,
          goalsSource: "local",
          isGoalsLoading: false,
        });
        return;
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed to load goals (${res.status})`);
      }

      const data = (await res.json()) as { goals: GoalItem[] };
      set({
        goals: data.goals,
        goalsSource: "api",
        isGoalsLoading: false,
      });
    } catch (err) {
      set({
        isGoalsLoading: false,
        goalsError: err instanceof Error ? err.message : "Failed to load goals",
      });
    }
  },

  selectItem: (internalId) => {
    set({ selectedInternalId: internalId.toUpperCase() });
  },

  clearSelection: () => {
    set({ selectedInternalId: null });
  },

  pinGoal: async (item) => {
    const { goals, goalsSource } = get();

    if (goals.some((g) => g.internalId === item.internalId)) {
      set({ goalsError: "This item is already pinned." });
      return;
    }

    if (goals.length >= MAX_PINNED_GOALS) {
      set({ goalsError: `You can pin at most ${MAX_PINNED_GOALS} goals.` });
      return;
    }

    set({ goalsError: null });

    if (goalsSource === "api") {
      const postRes = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalId: item.internalId }),
      });
      if (!postRes.ok) {
        const body = (await postRes.json().catch(() => ({}))) as {
          error?: string;
        };
        set({ goalsError: body.error ?? "Failed to pin goal." });
        return;
      }
      await get().fetchGoals();
      return;
    }

    const authProbe = await fetch("/api/goals");
    if (authProbe.status !== 401) {
      const postRes = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalId: item.internalId }),
      });
      if (!postRes.ok) {
        const body = (await postRes.json().catch(() => ({}))) as {
          error?: string;
        };
        set({ goalsError: body.error ?? "Failed to pin goal." });
        return;
      }
      await get().fetchGoals();
      return;
    }

    const stored = readLocalGoals();
    const newGoal: StoredLocalGoal = {
      id: crypto.randomUUID(),
      internalId: item.internalId,
      displayName: item.displayName,
      tier: item.tier,
      sortOrder: stored.length,
    };
    writeLocalGoals([...stored, newGoal]);
    set({
      goals: toGoalItems([...stored, newGoal]),
      goalsSource: "local",
    });
  },

  unpinGoal: async (goalId) => {
    const { goalsSource } = get();
    set({ goalsError: null });

    if (goalsSource === "api") {
      const res = await fetch(`/api/goals?id=${encodeURIComponent(goalId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        set({ goalsError: body.error ?? "Failed to remove goal." });
        return;
      }
      await get().fetchGoals();
      return;
    }

    const stored = readLocalGoals().filter((g) => g.id !== goalId);
    writeLocalGoals(stored);
    set({ goals: toGoalItems(stored), goalsSource: "local" });
  },

  setExpandBases: (value) => {
    set({ expandBases: value });
  },
}));
