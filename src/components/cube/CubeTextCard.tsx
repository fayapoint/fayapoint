"use client";
import { useT } from "@/i18n/dicionario";

import { useRef, useEffect, useState } from "react";
import type { SectionConfig } from "./cube-data";
import s from "./cube.module.css";

interface CubeTextCardProps {
  section: SectionConfig;
  onNavigate?: (href: string) => void;
}

export function CubeTextCard({ section, onNavigate }: CubeTextCardProps) {
  const T = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.1 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const posClass = section.position === "right" ? s.textCardRight
    : section.position === "center" ? s.textCardCenter
    : "";

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      // Scroll to section
      const el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (onNavigate) {
      e.preventDefault();
      onNavigate(href);
    }
  };

  return (
    <div ref={ref} className={`${s.textCard} ${posClass}`}>
      {section.position !== "left" || section.faceIndex > 0 ? (
        <div className={`${s.hLine} ${visible ? s.hLineVisible : ""}`} />
      ) : null}

      <div className={s.tag}>{T(section.tag)}</div>

      {section.faceIndex === 0 ? (
        <h1 className={s.heading}>
          {section.heading.map((line, i) => (
            <span key={i}>{T(line)}{i < section.heading.length - 1 && <br />}</span>
          ))}
        </h1>
      ) : (
        <h2 className={s.heading}>
          {section.heading.map((line, i) => (
            <span key={i}>{T(line)}{i < section.heading.length - 1 && <br />}</span>
          ))}
        </h2>
      )}

      <p className={s.bodyText}>
        {section.body.map((line, i) => (
          <span key={i}>{T(line)}{i < section.body.length - 1 && <br />}</span>
        ))}
      </p>

      {section.features && (
        <ul className={s.features}>
          {section.features.map((f, i) => (
            <li key={i}><span className={s.featureArrow}>→</span> {T(f)}</li>
          ))}
        </ul>
      )}

      {section.stats && (
        <div className={s.statRow} style={section.position === "right" ? { justifyContent: "flex-end" } : undefined}>
          {section.stats.map((stat, i) => (
            <div key={i}>
              <span className={s.statNum}>{T(stat.num)}</span>
              <span className={s.statLabel}>{T(stat.label)}</span>
            </div>
          ))}
        </div>
      )}

      <div className={s.ctaRow}>
        {section.prevHref && (
          <a className={s.ctaBack} href={section.prevHref} onClick={(e) => handleClick(e, section.prevHref!)}>
            {T(section.prevLabel)}
          </a>
        )}
        <a className={s.cta} href={section.nextRoute || section.nextHref} onClick={(e) => handleClick(e, section.nextRoute || section.nextHref)}>
          {T(section.nextLabel)}
        </a>
      </div>
    </div>
  );
}
