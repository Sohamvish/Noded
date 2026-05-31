"use client";

import { create } from "zustand";
import type { ProfileApiResponse } from "@/lib/items/types";

interface ProfileState {
  profile: ProfileApiResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/profile");
      if (res.status === 401) {
        set({ profile: null, isLoading: false, error: null });
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed to load profile (${res.status})`);
      }
      const profile = (await res.json()) as ProfileApiResponse;
      set({ profile, isLoading: false });
    } catch (err) {
      set({
        profile: null,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load profile",
      });
    }
  },

  clearProfile: () => set({ profile: null, error: null }),
}));
