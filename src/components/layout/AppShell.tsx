"use client";

import { AppMainContent } from "@/components/layout/AppMainContent";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { KpiRow } from "@/components/layout/KpiRow";

export function AppShell() {
  return (
    <div className="flex h-dvh overflow-hidden gap-4 p-4 lg:p-6">
      <AppSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
        <KpiRow />

        <main className="min-h-0 flex-1 overflow-hidden">
          <AppMainContent />
        </main>
      </div>
    </div>
  );
}
