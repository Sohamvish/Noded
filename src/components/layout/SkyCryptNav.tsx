"use client";

export type DashboardTab = "quest" | "player" | "item";

export interface SkyCryptNavProps {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
  hasItemSelected: boolean;
  /** Hide item tab when detail is shown in a side pane or bottom sheet (wide screens). */
  hideItemTab?: boolean;
}

const TABS: Array<{ id: DashboardTab; label: string }> = [
  { id: "quest", label: "Quest Board" },
  { id: "player", label: "Player" },
  { id: "item", label: "Item Details" },
];

export function SkyCryptNav({
  active,
  onChange,
  hasItemSelected,
  hideItemTab = false,
}: SkyCryptNavProps) {
  const tabs = hideItemTab ? TABS.filter((tab) => tab.id !== "item") : TABS;

  return (
    <nav
      aria-label="Dashboard sections"
      className="sticky top-0 z-20 py-1"
    >
      <div className="sc-nav-track overflow-x-auto">
        {tabs.map((tab) => {
          const disabled = tab.id === "item" && !hasItemSelected;
          const isActive = active === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(tab.id)}
              className={[
                "sc-nav-tab",
                isActive ? "sc-nav-tab-active" : "",
                disabled ? "cursor-not-allowed opacity-40" : "",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
