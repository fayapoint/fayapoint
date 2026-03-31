"use client";

import { useRef, useEffect } from "react";
import { FACES, FACE_NAMES } from "./cube-data";
import { CubeFace } from "./CubeFace";
import s from "./cube.module.css";

interface CubeSceneProps {
  rx: number;
  ry: number;
  activeSection: number;
  zooming: boolean;
  zoomFace: string | null;
  onFaceClick?: (face: string, route: string) => void;
}

const FACE_TO_INDEX: Record<string, number> = {
  top: 0, front: 1, right: 2, back: 3, left: 4, bottom: 5,
};


export function CubeScene({ rx, ry, activeSection, zooming, zoomFace, onFaceClick }: CubeSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);

  // Force pointer-events on face elements (turbopack CSS cache workaround)
  useEffect(() => {
    if (!cubeRef.current) return;
    const faces = cubeRef.current.querySelectorAll<HTMLElement>('[class*="face"]');
    faces.forEach((face) => {
      // Only set on actual face elements (not child elements like faceContent, faceGrid, etc.)
      const classList = Array.from(face.classList);
      const isFaceRoot = classList.some(c =>
        c.includes("faceFront") || c.includes("faceBack") ||
        c.includes("faceRight") || c.includes("faceLeft") ||
        c.includes("faceTop") || c.includes("faceBottom")
      );
      if (isFaceRoot) {
        face.style.pointerEvents = "all";
        face.style.cursor = "pointer";
      }
    });
  });

  // Ambient particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number; pulse: number }[] = [];
    const COUNT = 60;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize particles
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.3 + 0.05,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const t = now * 0.001;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const alpha = p.a * (0.6 + 0.4 * Math.sin(t * 0.8 + p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 168, 75, ${alpha})`;
        ctx.fill();
      }

      // Draw connection lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(212, 168, 75, ${0.04 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ONLY set transform here — must match what turbopack's server cache expects.
  // All other sizing (width, height, flexShrink, transformStyle) is applied
  // post-mount by CubeInteractive to avoid hydration mismatch.
  const cubeStyle: React.CSSProperties = {
    transform: zooming && zoomFace
      ? `rotateX(${rx}deg) rotateY(${ry}deg) scale(3.5)`
      : `rotateX(${rx}deg) rotateY(${ry}deg)`,
    transition: zooming ? "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)" : undefined,
  };

  return (
    <div className={s.scene}>
      {/* Ambient particle canvas */}
      <canvas ref={canvasRef} className={s.particleCanvas} />

      {/* Radial light behind cube */}
      <div className={s.ambientLight} />

      <div className={s.cube} style={cubeStyle} ref={cubeRef}>
        {FACES.map((config) => (
          <CubeFace
            key={config.face}
            config={config}
            isActive={activeSection === FACE_TO_INDEX[config.face]}
            onFaceClick={onFaceClick}
          />
        ))}
      </div>
    </div>
  );
}
