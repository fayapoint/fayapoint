"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { useTranslations } from "next-intl";

export function StickyCTA() {
  const t = useTranslations("StickyCTA");
  const { isLoggedIn, mounted } = useUser();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Don't show to logged-in users
    if (isLoggedIn) return;

    // Check if already dismissed this session
    const dismissed = sessionStorage.getItem("stickyCTADismissed");
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show after user scrolls 30% of page
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 30) {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLoggedIn]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("stickyCTADismissed", "true");
  };

  if (!mounted || isLoggedIn || isDismissed || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-purple-900/95 via-purple-800/95 to-pink-900/95 backdrop-blur-xl border-t border-purple-500/30 shadow-2xl"
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="hidden sm:flex w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">
                {t("title")}
              </p>
              <p className="text-purple-200 text-sm">
                {t("subtitle")}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/cursos"
              className="px-6 py-3 bg-white text-purple-900 font-semibold rounded-full hover:bg-purple-100 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
            >
              {t("cta")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={handleDismiss}
              className="p-2 text-purple-300 hover:text-white transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
