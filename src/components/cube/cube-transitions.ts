"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Navigate to a route with a zoom-into-cube-face animation.
 * The overlay fades in with a radial wipe from center,
 * creating a "flying into the face" illusion.
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

  // Phase 1: Radial wipe from center
  overlay.style.pointerEvents = "all";
  overlay.style.transition = "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
  overlay.style.opacity = "1";

  // Phase 2: Push route after animation starts
  setTimeout(() => {
    router.push(route);
  }, 500);
}

/**
 * Reverse animation: zoom out from page back to cube.
 * Used by BackToCube component.
 */
export function navigateBackToCube(
  router: AppRouterInstance,
  overlayRef: React.RefObject<HTMLDivElement | null>
) {
  const overlay = overlayRef.current;
  if (!overlay) {
    router.push("/");
    return;
  }

  overlay.style.pointerEvents = "all";
  overlay.style.transition = "opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
  overlay.style.opacity = "1";

  setTimeout(() => {
    router.push("/");
  }, 400);
}
