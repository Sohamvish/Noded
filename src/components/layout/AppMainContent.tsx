"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProfileSyncPanel } from "@/components/profile/ProfileSyncPanel";
import { RoadmapPlaceholder } from "@/components/roadmap/RoadmapPlaceholder";
import { useAppShellStore } from "@/stores/app-shell-store";

export function AppMainContent() {
  const activeView = useAppShellStore((s) => s.activeView);

  if (activeView === "profile-sync") {
    return (
      <div className="h-full min-h-0 overflow-hidden">
        <ProfileSyncPanel fullPage />
      </div>
    );
  }

  if (activeView === "roadmap") {
    return (
      <div className="h-full min-h-0 overflow-hidden">
        <RoadmapPlaceholder />
      </div>
    );
  }

  return (
    <div className="h-full min-h-0">
      <DashboardLayout />
    </div>
  );
}
