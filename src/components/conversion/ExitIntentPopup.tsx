"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Sparkles, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { useTranslations } from "next-intl";

export function ExitIntentPopup() {
  const t = useTranslations("ExitIntent");
  const { isLoggedIn, mounted } = useUser();
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  const handleExitIntent = useCallback((e: MouseEvent) => {
    // Only trigger when mouse leaves toward top of viewport
    if (e.clientY <= 5 && !hasShown && !isLoggedIn) {
      // Check if already shown this session
      const shown = sessionStorage.getItem("exitIntentShown");
      if (!shown) {
        setIsVisible(true);
        setHasShown(true);
        sessionStorage.setItem("exitIntentShown", "true");
      }
    }
  }, [hasShown, isLoggedIn]);

  useEffect(() => {
    if (!mounted || isLoggedIn) return;

    // Check if already shown
    const shown = sessionStorage.getItem("exitIntentShown");
    if (shown) {
      setHasShown(true);
      return;
    }

    // Add exit intent listener after 5 seconds on page
    const timer = setTimeout(() => {
      document.addEventListener("mouseout", handleExitIntent);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseout", handleExitIntent);
    };
  }, [mounted, isLoggedIn, handleExitIntent]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-gradient-to-br from-gray-900 via-amber-900/50 to-gray-900 rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Decorative background */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-yellow-500/20 rounded-full blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative p-8 text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 mb-6 shadow-lg shadow-amber-500/30">
              <Gift className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-white mb-3">
              {t("title")}
            </h2>
            
            <p className="text-muted-foreground mb-6 text-lg">
              {t("description")}
            </p>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary rounded-lg p-3">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{t("benefits.aiTools")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary rounded-lg p-3">
                <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <span>{t("benefits.freeCourses")}</span>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/aula-gratis"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-500 hover:to-yellow-500 text-white font-semibold text-lg rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105"
              onClick={handleClose}
            >
              {t("cta")}
              <ArrowRight className="w-5 h-5" />
            </Link>

            <p className="mt-4 text-sm text-muted-foreground">
              {t("noCreditCard")}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
