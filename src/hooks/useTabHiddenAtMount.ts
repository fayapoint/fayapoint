"use client";

import { useState } from "react";

/**
 * True when the tab was already hidden (backgrounded) at the moment this
 * component mounted. rAF-driven animations (framer-motion included) don't
 * progress in a hidden tab, so an entrance transition started while hidden
 * can leave content stuck at its pre-animation state (e.g. opacity 0)
 * indefinitely — even after the tab becomes visible again, since `initial`
 * is only read once at mount. Callers should skip the entrance animation
 * (render the settled end-state immediately) when this is true.
 */
export function useTabHiddenAtMount(): boolean {
  const [hidden] = useState(
    () => typeof document !== "undefined" && document.visibilityState === "hidden"
  );
  return hidden;
}
