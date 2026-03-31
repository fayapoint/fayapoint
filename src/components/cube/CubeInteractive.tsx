"use client";

import { useEffect } from "react";
import { FACES, getCubeRotation, N } from "./cube-data";

/**
 * Post-mount interactivity layer for cube faces.
 * Uses a transparent overlay that detects clicks on the cube area
 * without blocking scroll events (pointer-events: none by default,
 * only captures clicks via a click-through overlay technique).
 * Also fixes nav dot label visibility.
 */
export function CubeInteractive({ onFaceClick, activeSection }: {
  onFaceClick: (face: string, route: string) => void;
  activeSection: number;
}) {
  // Fix cube sizing + centering — backup for the inline script
  useEffect(() => {
    const fixCube = () => {
      const allCubeEls = Array.from(document.querySelectorAll('[class*="cube"]'));
      const cube = allCubeEls.find(el => el.children.length === 6) as HTMLElement | undefined;
      if (!cube) return false;
      if (cube.style.flexShrink === "0") return true; // Already fixed by inline script
      cube.style.width = "min(74vw, 74vh, 560px)";
      cube.style.height = "min(74vw, 74vh, 560px)";
      cube.style.flexShrink = "0";
      cube.style.position = "relative";
      cube.style.transformStyle = "preserve-3d";
      cube.style.willChange = "transform";
      cube.style.zIndex = "1";
      // Fix siblings to not interfere with flex centering
      const scene = cube.parentElement;
      if (scene) {
        Array.from(scene.children).forEach(child => {
          if (child !== cube) {
            (child as HTMLElement).style.position = "absolute";
            (child as HTMLElement).style.pointerEvents = "none";
          }
        });
      }
      return true;
    };
    if (!fixCube()) {
      const interval = setInterval(() => {
        if (fixCube()) clearInterval(interval);
      }, 50);
      return () => clearInterval(interval);
    }
  }, []);

  // Direct DOM cube rotation — bypasses React state entirely.
  // This ensures the cube rotates on scroll even when turbopack's
  // cached useScrollCube hook fails to trigger React re-renders.
  useEffect(() => {
    let smooth = 0;
    let lastNow = performance.now();
    let raf = 0;
    let cubeEl: HTMLElement | null = null;

    const findCube = () => {
      const els = document.querySelectorAll('[class*="cube"]');
      for (let i = 0; i < els.length; i++) {
        if (els[i].children.length === 6) { cubeEl = els[i] as HTMLElement; break; }
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) { lastNow = now; return; }
      if (!cubeEl) { findCube(); lastNow = now; return; }

      const dt = Math.min((now - lastNow) / 1000, 0.05);
      lastNow = now;

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const tgt = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      smooth += (tgt - smooth) * (1 - Math.exp(-dt * 10));
      smooth = Math.max(0, Math.min(1, smooth));

      const { rx, ry } = getCubeRotation(smooth);
      cubeEl.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Handle face click via overlay
  useEffect(() => {
    // Create a click overlay that sits over the cube area
    let overlay = document.getElementById("cube-click-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "cube-click-overlay";
      Object.assign(overlay.style, {
        position: "fixed",
        inset: "0",
        zIndex: "1",
        cursor: "pointer",
        pointerEvents: "none", // Allow scroll through
      });
      document.body.appendChild(overlay);
    }

    // On click anywhere in the viewport, check if it hit the cube
    const handleClick = (e: MouseEvent) => {
      // Find the cube element
      const allCubeEls = Array.from(document.querySelectorAll('[class*="cube"]'));
      const cube = allCubeEls.find(el => el.children.length === 6);
      if (!cube) return;

      const cubeRect = cube.getBoundingClientRect();

      // Check if click is within the cube's bounding box
      if (
        e.clientX >= cubeRect.left &&
        e.clientX <= cubeRect.right &&
        e.clientY >= cubeRect.top &&
        e.clientY <= cubeRect.bottom
      ) {
        // Don't trigger if clicking on UI elements (nav, text cards, buttons)
        const target = e.target as HTMLElement;
        if (
          target.closest('nav') ||
          target.closest('a') ||
          target.closest('button') ||
          target.closest('[class*="textCard"]') ||
          target.closest('[class*="scrollContainer"]')
        ) {
          return;
        }

        // Navigate to the active face's route
        const faceConfig = FACES[activeSection];
        if (faceConfig?.route) {
          onFaceClick(faceConfig.face, faceConfig.route);
        }
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
      overlay?.remove();
    };
  }, [onFaceClick, activeSection]);

  // Fix nav dot labels
  useEffect(() => {
    const dotLabels = document.querySelectorAll<HTMLElement>('[class*="navDotLabel"]');
    const cleanups: (() => void)[] = [];

    dotLabels.forEach(label => {
      label.style.position = "absolute";
      label.style.left = "1.5rem";
      label.style.top = "50%";
      label.style.transform = "translateY(-50%)";
      label.style.opacity = "0";
      label.style.pointerEvents = "none";
      label.style.transition = "opacity 0.3s ease";
      label.style.fontFamily = "var(--cube-font-mono, monospace)";
      label.style.fontSize = "0.5rem";
      label.style.letterSpacing = "0.15em";
      label.style.textTransform = "uppercase";
      label.style.whiteSpace = "nowrap";
      label.style.background = "rgba(28, 24, 20, 0.85)";
      label.style.padding = "0.2rem 0.5rem";

      const dot = label.parentElement;
      if (dot) {
        const enter = () => { label.style.opacity = "1"; };
        const leave = () => { label.style.opacity = "0"; };
        dot.addEventListener("pointerenter", enter);
        dot.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          dot.removeEventListener("pointerenter", enter);
          dot.removeEventListener("pointerleave", leave);
        });
      }
    });

    return () => cleanups.forEach(fn => fn());
  }, []);

  return null;
}
