"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Sparkles, 
  Shirt, 
  Store, 
  Zap, 
  ArrowRight, 
  Gift, 
  Palette,
  TrendingUp,
  CheckCircle,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export function ValuePropositionCTA() {
  const t = useTranslations("Home.ValueCTA");

  const steps = [
    {
      icon: Sparkles,
      emoji: "✨",
      gradient: "from-purple-500 to-pink-500",
      bg: "bg-purple-500/10",
    },
    {
      icon: Palette,
      emoji: "🎨",
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: Shirt,
      emoji: "👕",
      gradient: "from-green-500 to-emerald-500",
      bg: "bg-green-500/10",
    },
    {
      icon: Store,
      emoji: "🛒",
      gradient: "from-orange-500 to-amber-500",
      bg: "bg-orange-500/10",
    },
  ];

  const features = [
    { icon: Gift, key: "feature1" },
    { icon: Zap, key: "feature2" },
    { icon: TrendingUp, key: "feature3" },
  ];

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Badge className="mb-6 px-4 py-2 text-sm bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400">
              <Gift className="w-4 h-4 mr-2 inline" />
              {t("badge")}
            </Badge>
          </motion.div>

          {/* Main Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          >
            <span className="text-foreground">{t("title1")}</span>
            <br />
            <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              {t("title2")}
            </span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            {t("subtitle")}
          </motion.p>

          {/* Visual Flow - Steps */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center items-center gap-4 md:gap-6 mb-10"
          >
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${step.bg} border border-white/10 flex items-center justify-center shadow-lg`}
                >
                  <span className="text-2xl md:text-3xl">{step.emoji}</span>
                </motion.div>
                {idx < steps.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-muted-foreground hidden sm:block" />
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Step Labels */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-3xl mx-auto"
          >
            {steps.map((step, idx) => (
              <div key={idx} className="text-center">
                <p className="text-xs md:text-sm text-muted-foreground">
                  {t(`step${idx + 1}`)}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-6 mb-10"
          >
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 text-sm md:text-base text-muted-foreground"
              >
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>{t(feature.key)}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/portal">
              <Button 
                size="lg" 
                className="px-8 py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl shadow-purple-500/30"
              >
                <Play className="w-5 h-5 mr-2" />
                {t("ctaPrimary")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/precos">
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-6 text-lg border-white/20 hover:bg-white/5"
              >
                {t("ctaSecondary")}
              </Button>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1 }}
            className="text-xs text-muted-foreground/70 mt-6"
          >
            {t("trustNote")}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
