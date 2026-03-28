"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Navigate to a route with a zoom-into-cube-face animation.
 * The overlay fades in over 500ms, then we push the route,
 * and the target page handles its own fade-in.
 */
export function navigateWithZoom(
  router: AppRouterInstance,
  route: string,
  overlayRef: React.RefObject<HTMLDivElement | null>
) {
  const overlay = overlayRef.current;
  if (!overlay) {
    router.push(route);
    return;
  }

  overlay.style.pointerEvents = "all";
  overlay.style.transition = "opacity 0.5s ease";
  overlay.style.opacity = "1";

  setTimeout(() => {
    router.push(route);
  }, 400);
}
