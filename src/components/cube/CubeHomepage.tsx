"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useScrollCube } from "./useScrollCube";
import { CubeScene } from "./CubeScene";
import { CubeTextCard } from "./CubeTextCard";
import { navigateWithZoom } from "./cube-transitions";
import { SECTIONS, FACE_NAMES, N } from "./cube-data";
import s from "./cube.module.css";
import Link from "next/link";

export function CubeHomepage() {
  const router = useRouter();
  const { rx, ry, scrollNorm, activeSection, scrollToSection } = useScrollCube();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [cubeTheme, setCubeTheme] = useState<"dark" | "light">("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Force disable smooth scroll — native scroll + cube lerp handles smoothness
  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty("scroll-behavior", "auto", "important");
    html.classList.remove("scroll-smooth");
    return () => {
      html.style.removeProperty("scroll-behavior");
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setCubeTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const handleNavigate = useCallback((href: string) => {
    if (href.startsWith("#")) {
      const idx = parseInt(href.replace("#s", ""), 10);
      if (!isNaN(idx)) scrollToSection(idx);
    } else {
      navigateWithZoom(router, href, overlayRef);
    }
  }, [router, scrollToSection]);

  const pct = Math.round(scrollNorm * 100);
  const faceName = FACE_NAMES[activeSection] || "HERO";

  return (
    <div className="cube-homepage" data-cube-theme={cubeTheme} data-version="v2-mobile-menu">
      {/* 3D Cube Scene (fixed background) */}
      <CubeScene rx={rx} ry={ry} />

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
        <div>{String(pct).padStart(3, "0")}%</div>
        <div className={s.progressBar}>
          <div className={s.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <div>{faceName}</div>
      </div>

      {/* Nav dots (left side) */}
      <div className={s.navDots}>
        {Array.from({ length: N }).map((_, i) => (
          <button
            key={i}
            className={`${s.navDot} ${i === activeSection ? s.navDotActive : ""}`}
            onClick={() => scrollToSection(i)}
            aria-label={`Go to ${FACE_NAMES[i]}`}
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

      {/* Scroll sections with text cards */}
      <div id="cube-scroll-container" className={s.scrollContainer}>
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className={s.section}>
            <CubeTextCard section={section} onNavigate={handleNavigate} />
          </section>
        ))}
      </div>

      {/* Zoom transition overlay */}
      <div ref={overlayRef} className={s.zoomOverlay} />
    </div>
  );
}
