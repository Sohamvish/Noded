export interface SkyCryptProgressBarProps {
  value: number;
  maxed?: boolean;
  className?: string;
}

export function SkyCryptProgressBar({
  value,
  maxed = false,
  className = "",
}: SkyCryptProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className={`sc-skillbar-track ${className}`}>
      <div
        className={maxed || pct >= 100 ? "sc-skillbar-fill sc-skillbar-fill-maxed" : "sc-skillbar-fill"}
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
