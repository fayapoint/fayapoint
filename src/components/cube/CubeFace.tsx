"use client";

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

export function CubeFace({ config }: { config: FaceConfig }) {
  const { face, icon, title, subtitle, phantom, content } = config;

  // Image type: full-bleed image on the face, no icon/title/subtitle
  if (content.type === "image") {
    return (
      <div className={`${s.face} ${FACE_CLASS[face]}`}>
        <div className={s.faceImageContent}>
          <img src={content.src} alt={content.alt} className={s.faceImage} />
        </div>
        <span className={s.facePhantom}>{phantom}</span>
      </div>
    );
  }

  return (
    <div className={`${s.face} ${FACE_CLASS[face]}`}>
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
          <div className={s.faceGrid} style={{ gridTemplateColumns: "1fr" }}>
            <div className={s.faceGridItem} style={{ textAlign: "center", padding: "1rem" }}>
              <div className={s.faceGridItemLabel}>{content.url}</div>
              <div className={s.faceGridItemNum} style={{ fontSize: "1.2rem" }}>{content.label}</div>
            </div>
          </div>
        )}
      </div>
      <span className={s.facePhantom}>{phantom}</span>
    </div>
  );
}
