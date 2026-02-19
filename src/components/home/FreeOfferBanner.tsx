"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Gift,
  BookOpen,
  Sparkles,
  Palette,
  Award,
  Zap,
  ArrowRight,
  CheckCircle,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useUser } from "@/contexts/UserContext";

export function FreeOfferBanner() {
  const t = useTranslations("Home.FreeOffer");
  const { isLoggedIn, mounted } = useUser();

  // Don't show to logged-in users
  if (mounted && isLoggedIn) return null;

  const benefits = [
    { icon: BookOpen, key: "benefit1" },
    { icon: Sparkles, key: "benefit2" },
    { icon: Palette, key: "benefit3" },
    { icon: Award, key: "benefit4" },
    { icon: Zap, key: "benefit5" },
    { icon: Crown, key: "benefit6" },
  ];

  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-950/40 via-background to-pink-950/40" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6"
            >
              <Gift className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-green-400">{t("badge")}</span>
            </motion.div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="text-foreground">{t("title1")}</span>{" "}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {t("title2")}
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("subtitle")}</p>
          </div>

          {/* Benefits grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <benefit.icon className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{t(`${benefit.key}.title`)}</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">{t(`${benefit.key}.desc`)}</p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <Link href="/onboarding">
              <Button
                size="lg"
                className="px-10 py-7 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl shadow-green-600/20 group"
              >
                <Gift className="w-5 h-5 mr-2" />
                {t("cta")}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground/60 mt-4">{t("noCreditCard")}</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
