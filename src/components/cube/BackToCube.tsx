"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Floating "back to cube" button that appears on inner pages.
 * Navigates back to the homepage cube with a zoom-out transition.
 */
export function BackToCube() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  const handleBack = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setExiting(true);
    setTimeout(() => {
      router.push("/");
    }, 500);
  }, [router]);

  return (
    <>
      {/* Exit overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "var(--background, #1c1814)",
          opacity: exiting ? 1 : 0,
          pointerEvents: exiting ? "all" : "none",
          transition: "opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {/* Floating cube button */}
      <Link
        href="/"
        onClick={handleBack}
        style={{
          position: "fixed",
          bottom: "2rem",
          left: "2rem",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          background: "rgba(28, 24, 20, 0.8)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(212, 168, 75, 0.2)",
          color: "rgba(212, 168, 75, 0.8)",
          textDecoration: "none",
          fontSize: "0.6rem",
          fontFamily: "var(--font-dm-mono, monospace)",
          letterSpacing: "0.15em",
          textTransform: "uppercase" as const,
          transition: "all 0.3s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(212, 168, 75, 0.5)";
          e.currentTarget.style.color = "rgba(212, 168, 75, 1)";
          e.currentTarget.style.boxShadow = "0 0 20px rgba(212, 168, 75, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(212, 168, 75, 0.2)";
          e.currentTarget.style.color = "rgba(212, 168, 75, 0.8)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <span style={{
          display: "inline-block",
          width: "1rem",
          height: "1rem",
          border: "1px solid currentColor",
          transform: "rotate(45deg) scale(0.8)",
          position: "relative",
        }}>
          <span style={{
            position: "absolute",
            inset: "2px",
            border: "1px solid currentColor",
            opacity: 0.4,
          }} />
        </span>
        Voltar ao Cubo
      </Link>
    </>
  );
}
