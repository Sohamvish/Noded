import type { ReactNode } from "react";

export type PanelAccent = "teal" | "pink" | "green";

export interface SkyCryptPanelProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  accent?: PanelAccent;
}

const HEADER_ACCENT: Record<PanelAccent, string> = {
  teal: "sc-panel-header-teal",
  pink: "sc-panel-header-pink",
  green: "",
};

export function SkyCryptPanel({
  title,
  action,
  children,
  className = "",
  noPadding = false,
  accent = "green",
}: SkyCryptPanelProps) {
  const headerClass = accent === "green" ? "" : HEADER_ACCENT[accent];

  return (
    <section
      className={`nd-glass-card flex min-h-0 flex-col overflow-hidden rounded-2xl ${className}`}
    >
      {title ? (
        <header
          className={`sc-panel-header flex shrink-0 items-center justify-between gap-2 ${headerClass}`}
        >
          <span className="min-w-0 truncate">{title}</span>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div
        className={[
          "min-h-0 flex-1 overflow-y-auto",
          noPadding ? "" : "p-4",
        ].join(" ")}
      >
        {children}
      </div>
    </section>
  );
}
