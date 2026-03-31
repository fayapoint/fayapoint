"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useScrollCube } from "./useScrollCube";
import { CubeScene } from "./CubeScene";
import { CubeTextCard } from "./CubeTextCard";
import { navigateWithZoom } from "./cube-transitions";
import { SECTIONS, FACE_NAMES, N, STOPS } from "./cube-data";
import { CubeInteractive } from "./CubeInteractive";
import s from "./cube.module.css";
import Link from "next/link";

function NavDot({ index, active, label, onClick }: { index: number; active: boolean; label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      className={`${s.navDot} ${active ? s.navDotActive : ""}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`Go to ${label}`}
      suppressHydrationWarning
    >
      <span
        suppressHydrationWarning
        style={{
          position: "absolute",
          left: "1.5rem",
          top: "50%",
          transform: "translateY(-50%)",
          fontFamily: "var(--cube-font-mono, monospace)",
          fontSize: "0.5rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase" as const,
          color: active ? "var(--cube-accent)" : "var(--cube-muted)",
          whiteSpace: "nowrap",
          opacity: hovered ? 1 : 0,
          pointerEvents: "none" as const,
          transition: "opacity 0.3s ease",
          background: "rgba(28, 24, 20, 0.85)",
          backdropFilter: "blur(4px)",
          padding: "0.2rem 0.5rem",
        }}
      >
        {label}
      </span>
    </button>
  );
}

export function CubeHomepage() {
  const router = useRouter();
  const { rx, ry, scrollNorm, activeSection, scrollToSection } = useScrollCube();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [cubeTheme, setCubeTheme] = useState<"dark" | "light">("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [zooming, setZooming] = useState(false);
  const [zoomFace, setZoomFace] = useState<string | null>(null);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Force disable smooth scroll — native scroll + cube lerp handles smoothness
  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty("scroll-behavior", "auto", "important");
    html.classList.remove("scroll-smooth");
    return () => {
      html.style.removeProperty("scroll-behavior");
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
          e.preventDefault();
          scrollToSection(Math.min(activeSection + 1, N - 1));
          break;
        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault();
          scrollToSection(Math.max(activeSection - 1, 0));
          break;
        case "Enter": {
          // Dive into the active face
          const section = SECTIONS[activeSection];
          if (section?.nextRoute) {
            handleFaceClick(
              ["top", "front", "right", "back", "left", "bottom"][activeSection],
              section.nextRoute
            );
          }
          break;
        }
        case "Escape":
          setMobileMenuOpen(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSection, scrollToSection]);

  const toggleTheme = useCallback(() => {
    setCubeTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  // Face click → zoom into face → navigate
  const handleFaceClick = useCallback((face: string, route: string) => {
    setZooming(true);
    setZoomFace(face);

    // After zoom animation, navigate
    setTimeout(() => {
      navigateWithZoom(router, route, overlayRef);
    }, 600);
  }, [router]);

  const handleNavigate = useCallback((href: string) => {
    if (href.startsWith("#")) {
      const idx = parseInt(href.replace("#s", ""), 10);
      if (!isNaN(idx)) scrollToSection(idx);
    } else {
      // Use face zoom for route navigation
      const face = ["top", "front", "right", "back", "left", "bottom"][activeSection] || "front";
      handleFaceClick(face, href);
    }
  }, [scrollToSection, activeSection, handleFaceClick]);

  const pct = Math.round(scrollNorm * 100);
  const faceName = FACE_NAMES[activeSection] || "HERO";

  return (
    <div
      className={`cube-homepage ${entered ? s.entered : s.entering}`}
      data-cube-theme={cubeTheme}
      data-version="v3-interactive"
    >
      {/* 3D Cube Scene (fixed background) */}
      <CubeScene
        rx={rx}
        ry={ry}
        activeSection={activeSection}
        zooming={zooming}
        zoomFace={zoomFace}
        onFaceClick={handleFaceClick}
      />

      {/* Force interactivity on faces (turbopack cache workaround) */}
      <CubeInteractive onFaceClick={handleFaceClick} activeSection={activeSection} />

      {/* Navigation */}
      <nav className={s.nav}>
        <div className={s.navInner}>
          <Link href="/" className={s.navLogo}>
            FAY<span className={s.navLogoAccent}>AI</span>
          </Link>
          <div className={s.navLinks}>
            <Link href="/cursos" className={s.navLink}>Cursos</Link>
            <Link href="/certificacoes" className={s.navLink}>Certificados</Link>
            <Link href="/servicos" className={s.navLink}>Servicos</Link>
            <Link href="/precos" className={s.navLink}>Precos</Link>
            <Link href="/blog" className={s.navLink}>Blog</Link>
            <Link href="/portal" className={s.navLink}>Portal</Link>
            <Link href="/registro" className={s.navCta}>Comece Gratis</Link>
          </div>
          <button
            className={s.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className={s.mobileMenu}>
          <Link href="/cursos" className={s.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>Cursos</Link>
          <Link href="/certificacoes" className={s.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>Certificados</Link>
          <Link href="/servicos" className={s.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>Servicos</Link>
          <Link href="/precos" className={s.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>Precos</Link>
          <Link href="/portal" className={s.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>Portal</Link>
          <Link href="/registro" className={s.navCta} onClick={() => setMobileMenuOpen(false)} style={{ marginTop: "0.5rem", textAlign: "center" }}>Comece Gratis</Link>
        </div>
      )}

      {/* HUD (top-right) */}
      <div className={s.hud}>
        <div className={s.hudPct}>{String(pct).padStart(3, "0")}%</div>
        <div className={s.progressBar}>
          <div className={s.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <div className={s.hudFace}>{faceName}</div>
        <div className={s.hudHint}>
          {activeSection < N - 1 ? "↓ scroll" : ""}
        </div>
      </div>

      {/* Nav dots (left side) */}
      <div className={s.navDots}>
        {Array.from({ length: N }).map((_, i) => (
          <NavDot
            key={i}
            index={i}
            active={i === activeSection}
            label={FACE_NAMES[i]}
            onClick={() => scrollToSection(i)}
          />
        ))}
      </div>

      {/* Theme toggle */}
      <button className={s.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
        {cubeTheme === "dark" ? "☀" : "☾"}
      </button>

      {/* Face caption (bottom center) */}
      <div className={s.faceCaption}>
        <div className={s.faceCaptionNum}>{String(activeSection + 1).padStart(2, "0")}</div>
        <div className={s.faceCaptionName}>{faceName}</div>
      </div>

      {/* Keyboard hint */}
      <div className={s.keyboardHint}>
        <span>←→ navegar</span>
        <span>↵ entrar</span>
      </div>

      {/* Scroll sections with text cards */}
      <div id="cube-scroll-container" className={s.scrollContainer}>
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className={s.section}>
            <CubeTextCard section={section} onNavigate={handleNavigate} />
          </section>
        ))}
      </div>

      {/* Zoom transition overlay */}
      <div ref={overlayRef} className={`${s.zoomOverlay} ${zooming ? s.zoomOverlayActive : ""}`} />

      {/* Cube sizing + centering + rotation — vanilla JS, completely outside React.
          Turbopack on Windows caches stale CSS modules AND stale React hooks,
          so we bypass React entirely for the critical cube behavior. */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          var cubeEl = null;
          var smooth = 0;
          var lastNow = performance.now();
          var N = 6;
          var STOPS = [
            {rx:90,ry:0},{rx:0,ry:0},{rx:0,ry:-90},
            {rx:0,ry:-180},{rx:0,ry:-270},{rx:-90,ry:-360}
          ];

          function easeIO(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
          function getRotation(sn) {
            var t = sn * (N-1);
            var i = Math.min(Math.floor(t), N-2);
            var f = easeIO(t - i);
            var a = STOPS[i], b = STOPS[i+1];
            return { rx: a.rx+(b.rx-a.rx)*f, ry: a.ry+(b.ry-a.ry)*f };
          }

          function findCube() {
            var els = document.querySelectorAll('[class*="cube"]');
            for (var i = 0; i < els.length; i++) {
              if (els[i].children.length === 6) { cubeEl = els[i]; break; }
            }
          }

          function fixCube() {
            if (!cubeEl) { findCube(); }
            if (!cubeEl) { setTimeout(fixCube, 50); return; }
            cubeEl.style.width = 'min(74vw, 74vh, 560px)';
            cubeEl.style.height = 'min(74vw, 74vh, 560px)';
            cubeEl.style.flexShrink = '0';
            cubeEl.style.position = 'relative';
            cubeEl.style.transformStyle = 'preserve-3d';
            cubeEl.style.willChange = 'transform';
            cubeEl.style.zIndex = '1';
            var scene = cubeEl.parentElement;
            if (scene) {
              for (var j = 0; j < scene.children.length; j++) {
                var child = scene.children[j];
                if (child !== cubeEl) {
                  child.style.position = 'absolute';
                  child.style.pointerEvents = 'none';
                }
              }
            }
          }

          function frame(now) {
            requestAnimationFrame(frame);
            if (document.hidden) { lastNow = now; return; }
            if (!cubeEl) { findCube(); fixCube(); lastNow = now; return; }

            var dt = Math.min((now - lastNow) / 1000, 0.05);
            lastNow = now;

            var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            var tgt = Math.max(0, Math.min(1, window.scrollY / maxScroll));
            smooth += (tgt - smooth) * (1 - Math.exp(-dt * 10));
            smooth = Math.max(0, Math.min(1, smooth));

            var rot = getRotation(smooth);
            cubeEl.style.transform = 'rotateX('+rot.rx+'deg) rotateY('+rot.ry+'deg)';
          }

          fixCube();
          requestAnimationFrame(frame);
        })();
      `}} />
    </div>
  );
}
