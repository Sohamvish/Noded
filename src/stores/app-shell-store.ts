"use client";

import { create } from "zustand";

export type AppView = "dashboard" | "roadmap" | "profile-sync";

interface AppShellState {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
}

export const useAppShellStore = create<AppShellState>((set) => ({
  activeView: "dashboard",
  setActiveView: (view) => set({ activeView: view }),
}));
