"use client";

import { useEffect, useRef } from "react";

interface HoneypotFieldProps {
  onBotDetected?: () => void;
}

/**
 * Honeypot field to catch bots.
 * This field is hidden from real users but bots will fill it out.
 * If filled, we know it's a bot.
 */
export function HoneypotField({ onBotDetected }: HoneypotFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if field was auto-filled (bot behavior)
    const checkForBot = () => {
      if (inputRef.current?.value) {
        onBotDetected?.();
        console.warn("[SECURITY] Honeypot triggered - bot detected");
      }
    };

    // Check after a short delay (bots fill forms quickly)
    const timer = setTimeout(checkForBot, 500);
    return () => clearTimeout(timer);
  }, [onBotDetected]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        opacity: 0,
        height: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <label htmlFor="website_url">Website (leave empty)</label>
      <input
        ref={inputRef}
        type="text"
        id="website_url"
        name="website_url"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}

/**
 * Hook to validate honeypot on form submission
 */
export function useHoneypotValidation() {
  const validateHoneypot = (formData: FormData): boolean => {
    const honeypotValue = formData.get("website_url");
    if (honeypotValue && String(honeypotValue).trim() !== "") {
      console.warn("[SECURITY] Honeypot filled - rejecting submission");
      return false;
    }
    return true;
  };

  return { validateHoneypot };
}
