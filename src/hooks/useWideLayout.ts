"use client";

import { useEffect, useState } from "react";

/** Matches Tailwind `xl` — split-pane item detail and wider dashboard grid. */
const WIDE_LAYOUT_QUERY = "(min-width: 1280px)";

export function useWideLayout(): boolean {
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(WIDE_LAYOUT_QUERY);
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return wide;
}
