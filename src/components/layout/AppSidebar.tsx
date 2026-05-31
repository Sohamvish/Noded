"use client";

import { AuthNav } from "@/components/auth/AuthNav";
import { type AppView, useAppShellStore } from "@/stores/app-shell-store";

const NAV_ITEMS: Array<{ label: string; view: AppView }> = [
  { label: "Dashboard", view: "dashboard" },
  { label: "Roadmap", view: "roadmap" },
  { label: "Profile Sync", view: "profile-sync" },
];

export function AppSidebar() {
  const activeView = useAppShellStore((s) => s.activeView);
  const setActiveView = useAppShellStore((s) => s.setActiveView);

  return (
    <aside className="nd-glass-shell flex h-full w-64 shrink-0 flex-col overflow-hidden rounded-3xl p-5">
      <div className="mb-8 flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-sm font-bold text-white shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
          aria-hidden
        >
          N
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold leading-tight text-white">
            Noded
          </p>
          <p className="text-[11px] tracking-wide text-white/60">
            Ironman progression
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => setActiveView(item.view)}
              className={
                isActive
                  ? "rounded-2xl border border-white/25 bg-white/15 px-3 py-2.5 text-left text-sm font-medium text-white shadow-[0_4px_16px_rgba(0,0,0,0.15)] backdrop-blur-xl"
                  : "rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              }
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 min-w-0 overflow-hidden rounded-2xl border border-white/15 bg-black/25 p-3 backdrop-blur-xl">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/55">
          Account
        </p>
        <AuthNav />
      </div>
    </aside>
  );
}
