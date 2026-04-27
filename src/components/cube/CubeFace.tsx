"use client";

import { useState, useCallback } from "react";
import type { FaceConfig } from "./cube-data";
import s from "./cube.module.css";

const FACE_CLASS: Record<string, string> = {
  top: s.faceTop,
  front: s.faceFront,
  right: s.faceRight,
  back: s.faceBack,
  left: s.faceLeft,
  bottom: s.faceBottom,
};

interface CubeFaceProps {
  config: FaceConfig;
  isActive: boolean;
  onFaceClick?: (face: string, route: string) => void;
}

export function CubeFace({ config, isActive, onFaceClick }: CubeFaceProps) {
  const { face, icon, title, subtitle, phantom, route, routeLabel, content } = config;
  const [hovered, setHovered] = useState(false);

  const handleClick = useCallback(() => {
    if (route && onFaceClick) {
      onFaceClick(face, route);
    }
  }, [face, route, onFaceClick]);

  const faceClasses = [
    s.face,
    FACE_CLASS[face],
    isActive ? s.faceActive : "",
    hovered ? s.faceHovered : "",
    route ? s.faceClickable : "",
  ].filter(Boolean).join(" ");

  // Inline styles to force interactivity (turbopack CSS cache workaround)
  const interactiveStyle: React.CSSProperties = route ? {
    pointerEvents: "all",
    cursor: "pointer",
  } : {};

  const glowStyle: React.CSSProperties = hovered && isActive ? {
    position: "absolute" as const,
    inset: "-4px",
    border: "2px solid rgba(212, 168, 75, 0.4)",
    pointerEvents: "none" as const,
    zIndex: 3,
    opacity: 1,
    boxShadow: "0 0 20px rgba(212, 168, 75, 0.3), 0 0 40px rgba(212, 168, 75, 0.15), inset 0 0 20px rgba(212, 168, 75, 0.1)",
    transition: "opacity 0.4s ease",
  } : {
    position: "absolute" as const,
    inset: "-4px",
    border: "2px solid transparent",
    pointerEvents: "none" as const,
    zIndex: 3,
    opacity: 0,
    transition: "opacity 0.4s ease",
  };

  const tooltipStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "2rem",
    left: "50%",
    transform: `translateX(-50%) translateY(${hovered && isActive ? "0" : "8px"})`,
    zIndex: 4,
    fontFamily: "var(--cube-font-mono, monospace)",
    fontSize: "0.6rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--cube-accent)",
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(8px)",
    padding: "0.4rem 0.8rem",
    whiteSpace: "nowrap",
    opacity: hovered && isActive ? 1 : 0,
    transition: "opacity 0.3s ease, transform 0.3s ease",
    pointerEvents: "none",
  };

  // Image type: full-bleed image on the face
  if (content.type === "image") {
    return (
      <div
        className={faceClasses}
        style={interactiveStyle}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={handleClick}
      >
        <div className={s.faceImageContent}>
          <img src={content.src} alt={content.alt} className={s.faceImage} />
        </div>
        {route && (
          <button
            type="button"
            className={s.facePortal}
            onClick={(event) => {
              event.stopPropagation();
              handleClick();
            }}
            aria-label={routeLabel || "Entrar"}
          >
            <span className={s.facePortalCore} />
            <span className={s.facePortalOrbit} />
            <span className={s.facePortalText}>{routeLabel || "Entrar"}</span>
          </button>
        )}
        {/* Hover tooltip */}
        {route && <div style={tooltipStyle}>↗ {routeLabel || "Entrar"}</div>}
        {/* Glow ring on hover */}
        <div style={glowStyle} />
        <span className={s.facePhantom}>{phantom}</span>
      </div>
    );
  }

  return (
    <div
      className={faceClasses}
      style={interactiveStyle}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      <div className={s.faceContent}>
        <div className={s.faceIcon}>{icon}</div>
        <div className={s.faceTitle}>{title}</div>
        <div className={s.faceSubtitle}>{subtitle}</div>

        {content.type === "grid" && (
          <div className={s.faceGrid}>
            {content.items.map((item, i) => (
              <div key={i} className={s.faceGridItem}>
                <div className={s.faceGridItemNum}>{item.num}</div>
                <div className={s.faceGridItemLabel}>{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {content.type === "certificate" && (
          <div className={s.certCard}>
            <div className={s.certHeader}>FAYAPOINT</div>
            <div className={s.certSubheader}>Academia de Tecnologia & IA</div>
            <div className={s.certDivider} />
            <div className={s.certLabel}>Certificado de Conclusao</div>
            <div className={s.certName}>{content.name}</div>
            <div className={s.certCourse}>{content.course}</div>
            <div className={s.certSeal}>🏅</div>
            <div className={s.certMeta}>
              <span>Avaliacao: {content.score}</span>
              <span>•</span>
              <span>{content.code}</span>
            </div>
            <div className={s.certFooter}>
              <span>Ricardo Faya</span>
              <span>FayAi Academy</span>
            </div>
          </div>
        )}

        {content.type === "services" && (
          <div className={s.faceServiceList}>
            {content.items.map((item, i) => (
              <div key={i} className={s.faceServiceItem}>
                <span className={s.faceServiceArrow}>→</span> {item}
              </div>
            ))}
          </div>
        )}

        {content.type === "cta" && (
          <div className={s.faceCtaContent}>
            <div className={s.faceCtaLabel}>{content.label}</div>
            <div className={s.faceCtaUrl}>{content.url}</div>
          </div>
        )}
      </div>

      {route && (
        <button
          type="button"
          className={s.facePortal}
          onClick={(event) => {
            event.stopPropagation();
            handleClick();
          }}
          aria-label={routeLabel || "Entrar"}
        >
          <span className={s.facePortalCore} />
          <span className={s.facePortalOrbit} />
          <span className={s.facePortalText}>{routeLabel || "Entrar"}</span>
        </button>
      )}

      {/* Hover tooltip */}
      {route && <div style={tooltipStyle}>↗ {routeLabel || "Entrar"}</div>}
      {/* Glow ring on hover */}
      <div style={glowStyle} />
      <span className={s.facePhantom}>{phantom}</span>
    </div>
  );
}
