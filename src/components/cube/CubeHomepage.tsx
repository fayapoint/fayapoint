"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useScrollCube } from "./useScrollCube";
import { CubeScene } from "./CubeScene";
import { CubeTextCard } from "./CubeTextCard";
import { navigateWithZoom } from "./cube-transitions";
import { SECTIONS, FACES, FACE_NAMES, N } from "./cube-data";
import { CubeInteractive } from "./CubeInteractive";
import { useUser } from "@/contexts/UserContext";
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
  const pathname = usePathname();
  const { user, isLoggedIn, mounted } = useUser();
  const { rx, ry, scrollNorm, activeSection, scrollToSection } = useScrollCube();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [cubeTheme, setCubeTheme] = useState<"dark" | "light">("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [cubeHovering, setCubeHovering] = useState(false);
  const [zooming, setZooming] = useState(false);
  const [zoomFace, setZoomFace] = useState<string | null>(null);
  const [dashboardSnapshot, setDashboardSnapshot] = useState<{
    courses?: { courseId: string; progressPercent: number; details?: { title?: string; slug?: string } }[];
    stats?: { level?: number; xp?: number; streak?: number; imagesGenerated?: number; aiChats?: number };
    plan?: string;
  } | null>(null);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted || !isLoggedIn) return;
    let alive = true;
    fetch("/api/user/dashboard", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (alive && data) setDashboardSnapshot(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [mounted, isLoggedIn]);

  // Force disable smooth scroll — native scroll + cube lerp handles smoothness
  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty("scroll-behavior", "auto", "important");
    html.classList.remove("scroll-smooth");
    return () => {
      html.style.removeProperty("scroll-behavior");
    };
  }, []);

  const locale = pathname?.split("/").find((part) => part === "pt-BR" || part === "en") || "pt-BR";
  const localizeRoute = useCallback((href: string) => {
    if (!href.startsWith("/") || href.startsWith(`/${locale}`) || href.startsWith("/api")) return href;
    return `/${locale}${href}`;
  }, [locale]);

  // Face click -> zoom into face -> navigate
  const handleFaceClick = useCallback((face: string, route: string) => {
    setZooming(true);
    setZoomFace(face);

    // After zoom animation, navigate
    setTimeout(() => {
      navigateWithZoom(router, localizeRoute(route), overlayRef);
    }, 600);
  }, [localizeRoute, router]);

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
  }, [activeSection, scrollToSection, handleFaceClick]);

  const toggleTheme = useCallback(() => {
    setCubeTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const handleNavigate = useCallback((href: string) => {
    if (href.startsWith("#")) {
      const idx = parseInt(href.replace("#s", ""), 10);
      if (!isNaN(idx)) scrollToSection(idx);
    } else {
      // Use face zoom for route navigation
      const face = ["top", "front", "right", "back", "left", "bottom"][activeSection] || "front";
      handleFaceClick(face, localizeRoute(href));
    }
  }, [scrollToSection, activeSection, handleFaceClick, localizeRoute]);

  const pct = Math.round(scrollNorm * 100);
  const faceName = FACE_NAMES[activeSection] || "HERO";
  const activeFace = FACES[activeSection];
  const firstName = user?.name?.split(" ")[0] || "Aluno";
  const stats = dashboardSnapshot?.stats || user?.progress;
  const courses = dashboardSnapshot?.courses || [];
  const nextCourse = courses
    .filter((course) => (course.progressPercent || 0) < 100)
    .sort((a, b) => (b.progressPercent || 0) - (a.progressPercent || 0))[0];
  const hasLearningHistory = Boolean(nextCourse || (stats?.level && stats.level > 1) || (stats?.xp && stats.xp > 0));
  const journeyLabel = nextCourse
    ? `${Math.round(nextCourse.progressPercent || 0)}% em ${nextCourse.details?.title || nextCourse.courseId}`
    : hasLearningHistory
      ? `Nível ${stats?.level || 1} · ${stats?.xp || 0} XP`
      : "Sua jornada está pronta para começar";
  const personalizedSections = useMemo(() => {
    if (!isLoggedIn) return SECTIONS;
    return SECTIONS.map((section) => {
      if (section.id === "s0") {
        return {
          ...section,
          tag: `Bem-vindo de volta, ${firstName}`,
          heading: hasLearningHistory ? ["CONTINUE", "SUA", "JORNADA"] : ["COMECE", "COM", "INTENÇÃO"],
          body: hasLearningHistory
            ? [
                "O cubo reconhece seu progresso.",
                journeyLabel,
                "Entre no painel ou explore novas trilhas quando quiser.",
              ]
            : [
                "Você já está logado.",
                "Escolha uma trilha, crie no Studio AI ou veja sua área do aluno.",
                "A FayAI agora acompanha seu próximo passo.",
              ],
          nextLabel: hasLearningHistory ? "Abrir Dashboard ->" : "Ver Minha Jornada ->",
          nextRoute: "/portal",
          nextHref: "/portal",
        };
      }
      if (section.id === "s5") {
        return {
          ...section,
          tag: "05 — Próximo Passo",
          heading: ["VOLTE", "AO SEU", "PAINEL"],
          body: [
            "Continue cursos, use o Studio AI, veja ranking e recompensas.",
            "O cubo é a porta de entrada; o dashboard é sua central de ação.",
          ],
          nextLabel: "Entrar no Dashboard ->",
          nextRoute: "/portal",
          nextHref: "/portal",
        };
      }
      return section;
    });
  }, [firstName, hasLearningHistory, isLoggedIn, journeyLabel]);
  const activeSectionConfig = personalizedSections[activeSection];
  const hitRoute = activeSectionConfig?.nextRoute || activeFace?.route;
  return (
    <div
      className={`cube-homepage ${entered ? s.entered : s.entering} ${cubeHovering ? s.cubeHovering : ""}`}
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
            <button type="button" className={s.navLinkButton} onClick={() => scrollToSection(0)}>Cubo</button>
            <Link href="/descobrir" className={s.navLink}>Descobrir</Link>
            <Link href="/cursos" className={s.navLink}>Cursos</Link>
            <Link href="/certificacoes" className={s.navLink}>Certificados</Link>
            <Link href="/servicos" className={s.navLink}>Serviços</Link>
            <Link href="/precos" className={s.navLink}>Preços</Link>
            <Link href="/blog" className={s.navLink}>Blog</Link>
            <Link href="/portal" className={s.navLink}>{isLoggedIn ? "Minha Jornada" : "Portal"}</Link>
            <Link href={isLoggedIn ? "/portal" : "/registro"} className={s.navCta}>
              {isLoggedIn ? "Continuar" : "Comece Grátis"}
            </Link>
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
          <Link href="/descobrir" className={s.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>Descobrir</Link>
          <Link href="/cursos" className={s.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>Cursos</Link>
          <Link href="/certificacoes" className={s.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>Certificados</Link>
          <Link href="/servicos" className={s.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>Serviços</Link>
          <Link href="/precos" className={s.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>Preços</Link>
          <Link href="/portal" className={s.mobileMenuLink} onClick={() => setMobileMenuOpen(false)}>{isLoggedIn ? "Minha Jornada" : "Portal"}</Link>
          <Link href={isLoggedIn ? "/portal" : "/registro"} className={s.navCta} onClick={() => setMobileMenuOpen(false)} style={{ marginTop: "0.5rem", textAlign: "center" }}>
            {isLoggedIn ? "Continuar" : "Comece Grátis"}
          </Link>
        </div>
      )}

      {/* Logged-in journey panel */}
      {mounted && isLoggedIn && (
        <div className={s.userDock}>
          <div className={s.userDockEyebrow}>Sua jornada FayAI</div>
          <div className={s.userDockTitle}>{firstName}, pronto para continuar?</div>
          <div className={s.userDockMeta}>{journeyLabel}</div>
          <div className={s.userDockActions}>
            <button type="button" onClick={() => handleNavigate("/portal")} className={s.userDockPrimary}>
              Dashboard
            </button>
            <button type="button" onClick={() => scrollToSection(nextCourse ? 1 : 5)} className={s.userDockSecondary}>
              Girar cubo
            </button>
          </div>
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

      {activeFace && hitRoute && (
        <button
          type="button"
          className={s.cubeHitLayer}
          onPointerEnter={() => setCubeHovering(true)}
          onPointerLeave={() => setCubeHovering(false)}
          onClick={() => handleFaceClick(activeFace.face, hitRoute)}
          aria-label={`Entrar em ${faceName}`}
        />
      )}

      {/* Keyboard hint */}
      <div className={s.keyboardHint}>
        <span>←→ navegar</span>
        <span>↵ entrar</span>
      </div>

      <div className={s.mobileActionRail}>
        <button type="button" onClick={() => handleNavigate(isLoggedIn ? "/portal" : "/descobrir")}>
          {isLoggedIn ? "Minha Jornada" : "Descobrir"}
        </button>
        <button type="button" onClick={() => scrollToSection(Math.min(activeSection + 1, N - 1))}>
          Girar Cubo
        </button>
      </div>

      {/* Scroll sections with text cards */}
      <div id="cube-scroll-container" className={s.scrollContainer}>
        {personalizedSections.map((section) => (
          <section key={section.id} id={section.id} className={s.section}>
            <CubeTextCard section={section} onNavigate={handleNavigate} />
          </section>
        ))}
      </div>

      {/* Zoom transition overlay */}
      <div ref={overlayRef} className={`${s.zoomOverlay} ${zooming ? s.zoomOverlayActive : ""}`} />
    </div>
  );
}
