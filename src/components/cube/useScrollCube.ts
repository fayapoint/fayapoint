"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { N, getCubeRotation } from "./cube-data";

interface ScrollCubeState {
  rx: number;
  ry: number;
  scrollNorm: number;
  activeSection: number;
}

export function useScrollCube() {
  const [state, setState] = useState<ScrollCubeState>({ rx: 90, ry: 0, scrollNorm: 0, activeSection: 0 });
  const smoothRef = useRef(0);
  const maxScrollRef = useRef(1);
  const sectionTopsRef = useRef<number[]>([]);
  const rafRef = useRef<number>(0);
  const lastNowRef = useRef(0);

  const buildSectionTops = useCallback(() => {
    const sections = document.querySelectorAll<HTMLElement>("#cube-scroll-container section");
    sectionTopsRef.current = Array.from(sections).map(
      (s) => s.getBoundingClientRect().top + window.scrollY
    );
  }, []);

  const sectionIndexFromScroll = useCallback((y: number) => {
    const mid = y + window.innerHeight * 0.5;
    let idx = 0;
    for (let i = 0; i < sectionTopsRef.current.length; i++) {
      if (mid >= sectionTopsRef.current[i]) idx = i;
    }
    return Math.min(idx, N - 1);
  }, []);

  // Scroll to a section by index (smooth native scroll)
  const scrollToSection = useCallback((index: number) => {
    const tops = sectionTopsRef.current;
    if (tops[index] !== undefined) {
      window.scrollTo({ top: tops[index], behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const resize = () => {
      maxScrollRef.current = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      buildSectionTops();
    };

    // Animation loop: reads native scroll position, smoothly interpolates cube rotation
    const frame = (now: number) => {
      rafRef.current = requestAnimationFrame(frame);
      if (document.hidden) { lastNowRef.current = now; return; }
      const dt = Math.min((now - lastNowRef.current) / 1000, 0.05);
      lastNowRef.current = now;

      // Target from native scroll position
      const tgt = Math.max(0, Math.min(1, window.scrollY / maxScrollRef.current));

      // Smooth interpolation toward target (lerp with exponential decay)
      smoothRef.current += (tgt - smoothRef.current) * (1 - Math.exp(-dt * 10));
      smoothRef.current = Math.max(0, Math.min(1, smoothRef.current));

      const { rx, ry } = getCubeRotation(smoothRef.current);
      const activeSection = sectionIndexFromScroll(window.scrollY);

      setState({ rx, ry, scrollNorm: smoothRef.current, activeSection });
    };

    resize();
    lastNowRef.current = performance.now();
    rafRef.current = requestAnimationFrame(frame);

    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      ro.disconnect();
    };
  }, [buildSectionTops, sectionIndexFromScroll]);

  return { ...state, scrollToSection };
}
