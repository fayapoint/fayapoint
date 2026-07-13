"use client";

import { useCallback, useState, type MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./back-to-cube.module.css";

/**
 * Small FayAI 3D logo that returns to the cube with a zoom-out transition.
 */
export function BackToCube() {
  const router = useRouter();
  const pathname = usePathname();
  const [exiting, setExiting] = useState(false);
  const locale = pathname?.split("/").find((part) => part === "pt-BR" || part === "en");
  const cubeHref = locale ? `/${locale}` : "/";
  const isPortal = pathname?.includes("/portal");

  const handleBack = useCallback((event: MouseEvent) => {
    event.preventDefault();
    setExiting(true);
    setTimeout(() => {
      router.push(cubeHref);
    }, 460);
  }, [router, cubeHref]);

  // Dentro do shell do portal a navegação é da sidebar/bottom-nav — um botão
  // flutuante "sair para a home" quebra o senso de pertencimento (13/07/2026).
  if (isPortal) return null;

  return (
    <>
      <div className={`${styles.exitOverlay} ${exiting ? styles.exitOverlayActive : ""}`} />

      <Link
        href={cubeHref}
        onClick={handleBack}
        className={`${styles.logoBack} ${isPortal ? styles.logoBackPortal : styles.logoBackInner}`}
        aria-label={locale === "en" ? "Back to the FayAI cube" : "Voltar ao cubo FayAI"}
        title={locale === "en" ? "Back to the FayAI cube" : "Voltar ao cubo FayAI"}
      >
        <span className={styles.logoStage} aria-hidden="true">
          <span className={styles.logoCube}>
            <span className={`${styles.logoFace} ${styles.logoFaceFront}`} />
            <span className={`${styles.logoFace} ${styles.logoFaceRight}`} />
            <span className={`${styles.logoFace} ${styles.logoFaceTop}`} />
          </span>
          <span className={styles.logoSpark}>F</span>
        </span>
        <span className={styles.logoText}>FAYAI</span>
      </Link>
    </>
  );
}
