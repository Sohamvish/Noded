"use client";

import { useCallback, useState } from "react";
import { useWideLayout } from "@/hooks/useWideLayout";

export function useDashboardLayout() {
  const wideLayout = useWideLayout();
  const [browseDrawerOpen, setBrowseDrawerOpen] = useState(false);

  const openBrowseDrawer = useCallback(() => setBrowseDrawerOpen(true), []);
  const closeBrowseDrawer = useCallback(() => setBrowseDrawerOpen(false), []);

  return {
    wideLayout,
    browseDrawerOpen,
    setBrowseDrawerOpen,
    openBrowseDrawer,
    closeBrowseDrawer,
  };
}
