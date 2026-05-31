"use client";

import { useEffect } from "react";
import { CategoryNav } from "@/components/dashboard/CategoryNav";
import { ItemDetailPanel } from "@/components/dashboard/ItemDetailPanel";
import { PinnedGoals } from "@/components/dashboard/PinnedGoals";
import { ShoppingList } from "@/components/dashboard/ShoppingList";
import { ItemSearch } from "@/components/search/ItemSearch";
import { SkyCryptPanel } from "@/components/layout/SkyCryptPanel";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { useDashboardStore } from "@/stores/dashboard-store";

function SearchPanel() {
  const selectItem = useDashboardStore((s) => s.selectItem);
  const pinGoal = useDashboardStore((s) => s.pinGoal);

  return (
    <SkyCryptPanel title="Search items" accent="teal" className="shrink-0">
      <ItemSearch
        className="w-full"
        onSelect={(item) => selectItem(item.internalId)}
        onPinGoal={(item) => void pinGoal(item)}
      />
    </SkyCryptPanel>
  );
}

function QuestBoardPanels() {
  return (
    <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-2">
      <PinnedGoals className="min-h-0" />
      <ShoppingList className="min-h-0" />
    </div>
  );
}

function BrowseDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close browse menu"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        className="nd-glass-card fixed inset-y-0 left-0 z-50 flex w-[min(320px,88vw)] flex-col overflow-hidden rounded-l-none rounded-r-2xl"
        aria-label="Browse items"
      >
        <header className="sc-panel-header sc-panel-header-teal flex shrink-0 items-center justify-between gap-2">
          <span>Browse by skill</span>
          <button type="button" onClick={onClose} className="sc-btn-ghost text-xs">
            Close
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <CategoryNav />
        </div>
      </aside>
    </>
  );
}

function ItemDetailSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const selectedInternalId = useDashboardStore((s) => s.selectedInternalId);

  if (!open || !selectedInternalId) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close item details"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <section
        className="nd-glass-card fixed inset-x-0 bottom-0 z-50 flex max-h-[min(92dvh,900px)] flex-col overflow-hidden rounded-b-none rounded-t-2xl"
        aria-label="Item details"
      >
        <ItemDetailPanel embedded />
      </section>
    </>
  );
}

export function DashboardLayout() {
  const fetchGoals = useDashboardStore((s) => s.fetchGoals);
  const selectedInternalId = useDashboardStore((s) => s.selectedInternalId);
  const clearSelection = useDashboardStore((s) => s.clearSelection);

  const { wideLayout, browseDrawerOpen, openBrowseDrawer, closeBrowseDrawer } =
    useDashboardLayout();

  const showItemSheet = !wideLayout && Boolean(selectedInternalId);

  useEffect(() => {
    void fetchGoals();
  }, [fetchGoals]);

  useEffect(() => {
    if (selectedInternalId && browseDrawerOpen) {
      closeBrowseDrawer();
    }
  }, [selectedInternalId, browseDrawerOpen, closeBrowseDrawer]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (browseDrawerOpen) {
        closeBrowseDrawer();
        return;
      }

      if (showItemSheet) {
        clearSelection();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [browseDrawerOpen, closeBrowseDrawer, clearSelection, showItemSheet]);

  const centerColumn = (
    <div className="flex min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
      {!wideLayout ? (
        <button
          type="button"
          onClick={openBrowseDrawer}
          className="sc-btn w-fit shrink-0 text-xs"
        >
          Browse items
        </button>
      ) : null}
      <SearchPanel />
      <QuestBoardPanels />
    </div>
  );

  if (wideLayout) {
    return (
      <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(220px,22%)_minmax(0,1fr)_minmax(300px,28%)]">
        <aside className="nd-glass-card flex min-h-0 flex-col overflow-hidden rounded-2xl">
          <header className="sc-panel-header sc-panel-header-teal shrink-0">
            Browse by skill
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <CategoryNav />
          </div>
        </aside>

        {centerColumn}

        <aside className="nd-glass-card flex min-h-0 flex-col overflow-hidden rounded-2xl">
          <header className="sc-panel-header sc-panel-header-pink shrink-0">
            Item details
          </header>
          <div className="min-h-0 flex-1 overflow-hidden">
            <ItemDetailPanel embedded showEmptyPlaceholder />
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <BrowseDrawer open={browseDrawerOpen} onClose={closeBrowseDrawer} />
      <ItemDetailSheet open={showItemSheet} onClose={() => clearSelection()} />
      {centerColumn}
    </div>
  );
}
