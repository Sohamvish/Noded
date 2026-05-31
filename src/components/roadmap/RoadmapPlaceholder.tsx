import { SkyCryptPanel } from "@/components/layout/SkyCryptPanel";

export function RoadmapPlaceholder() {
  return (
    <SkyCryptPanel title="Roadmap" accent="pink" className="h-full">
      <p className="text-sm text-white/75">
        The bubble-map roadmap view is coming next. Use the Dashboard browse panel
        to explore items by skill in the meantime.
      </p>
    </SkyCryptPanel>
  );
}
