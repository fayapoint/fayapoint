"use client";

import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ChevronRight,
  LayoutDashboard,
  Workflow,
  Brain,
  Clapperboard,
  Monitor,
  Target,
  Rocket,
  CheckCircle2,
  Heart,
  Shield,
  Globe,
  Lightbulb,
  Headphones,
  Code,
  Bot,
  MapPin,
  Mail,
  MessageSquare,
  Zap,
  Cpu,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTranslations } from "next-intl";

// Hero section with parallax
function HeroSection() {
  const t = useTranslations("WhatWeDo.Hero");
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-background to-background" />
        <motion.div
          className="absolute top-20 left-10 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[150px]"
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.3, 1], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, delay: 3 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[180px]"
          style={{ y }}
        />
      </div>

      <motion.div style={{ opacity }} className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 mb-8"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </motion.div>
            <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t("badge")}
            </span>
          </motion.div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="block text-white"
            >
              {t("title.line1")}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="block bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent"
            >
              {t("title.line2")}
            </motion.span>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            {t("subtitle")}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/servicos/construcao-de-sites">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6">
                {t("cta.primary")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/agendar-consultoria">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white/20 hover:bg-white/10">
                {t("cta.secondary")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-gray-500">
            <ChevronRight className="w-8 h-8 rotate-90" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// Mission section
function MissionSection() {
  const t = useTranslations("WhatWeDo.Mission");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const values = [
    { icon: Heart, title: t("values.passion.title"), description: t("values.passion.description") },
    { icon: Shield, title: t("values.excellence.title"), description: t("values.excellence.description") },
    { icon: Globe, title: t("values.accessibility.title"), description: t("values.accessibility.description") },
    { icon: Lightbulb, title: t("values.innovation.title"), description: t("values.innovation.description") },
  ];

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Mission statement */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">{t("badge")}</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-white">{t("title.part1")} </span>
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t("title.part2")}
              </span>
            </h2>
            
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              {t("description")}
            </p>
            
            {/* Quote */}
            <div className="relative p-6 bg-white/5 border-l-4 border-purple-500 rounded-r-xl">
              <p className="text-lg text-gray-300 italic">&quot;{t("quote")}&quot;</p>
              <p className="text-sm text-gray-500 mt-2">— Ricardo Faya, Fundador</p>
            </div>
          </motion.div>

          {/* Right: Values grid */}
          <div className="grid grid-cols-2 gap-4">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-sm text-gray-400">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PipelineSection() {
  const t = useTranslations("WhatWeDo.Pipeline");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-120px" });

  return (
    <section ref={ref} className="py-24 relative bg-white/[0.02] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-10 top-20 w-72 h-72 bg-purple-500/10 blur-[140px]" />
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-blue-500/10 blur-[160px]" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Workflow className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t("badge")}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{t("title")}</h2>
          <p className="text-lg text-gray-400">{t("subtitle")}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {["0", "1", "2", "3"].map((idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: Number(idx) * 0.08 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                    {t(`items.${idx}.title`)}
                  </p>
                  <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                    {t(`items.${idx}.description`)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white/90 font-semibold">
                  {Number(idx) + 1}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {t.raw(`items.${idx}.metrics`).map((metric: string) => (
                  <span
                    key={metric}
                    className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/10"
                  >
                    {metric}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OutcomesSection() {
  const t = useTranslations("WhatWeDo.Outcomes");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-120px" });

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-10 top-10 w-64 h-64 bg-emerald-400/10 blur-[130px]" />
        <div className="absolute right-10 bottom-10 w-72 h-72 bg-blue-400/10 blur-[140px]" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Rocket className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">{t("badge")}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{t("title")}</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {t.raw("cards").map(
            (card: { title: string; value: string; description: string }, idx: number) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-3 hover:border-emerald-500/30 transition-colors"
              >
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">{card.title}</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{card.value}</div>
                <p className="text-sm text-gray-400 leading-relaxed">{card.description}</p>
              </motion.div>
            )
          )}
        </div>
      </div>
    </section>
  );
}

function StacksSection() {
  const t = useTranslations("WhatWeDo.Stacks");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-120px" });

  const columns: { key: "webSeo" | "automationAi" | "contentVideo"; icon: React.ElementType }[] = [
    { key: "webSeo", icon: LayoutDashboard },
    { key: "automationAi", icon: Workflow },
    { key: "contentVideo", icon: Clapperboard },
  ];

  return (
    <section ref={ref} className="py-24 relative overflow-hidden bg-white/[0.02]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[70%] h-40 bg-gradient-to-b from-white/5 to-transparent blur-3xl" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-4">
            <Code className="w-4 h-4 text-white/80" />
            <span className="text-sm font-medium text-white/80">{t("badge")}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{t("title")}</h2>
          <p className="text-lg text-gray-400">{t("subtitle")}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {columns.map((col, idx) => (
            <motion.div
              key={col.key}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                  <col.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">{t(`columns.${col.key}.title`)}</h3>
              </div>
              <div className="space-y-2">
                {t.raw(`columns.${col.key}.items`).map((item: string) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PillarDetailSection({
  pillar,
  index,
}: {
  pillar: {
    id: string;
    icon: React.ElementType;
    gradient: string;
    features: { icon: React.ElementType; title: string; description: string }[];
  };
  index: number;
}) {
  const t = useTranslations(`WhatWeDo.Pillars.${pillar.id}`);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const isReversed = index % 2 === 1;

  return (
    <section ref={ref} className={`py-24 relative ${index % 2 === 1 ? "bg-white/[0.02]" : ""}`}>
      <div className="container mx-auto px-4">
        <div className={`grid lg:grid-cols-2 gap-16 items-center ${isReversed ? "lg:grid-flow-dense" : ""}`}>
          {/* Content side */}
          <motion.div
            initial={{ opacity: 0, x: isReversed ? 50 : -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className={isReversed ? "lg:col-start-2" : ""}
          >
            {/* Icon badge */}
            <motion.div
              className={`inline-flex w-20 h-20 rounded-2xl bg-gradient-to-br ${pillar.gradient} items-center justify-center mb-6 shadow-lg`}
              whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              <pillar.icon className="w-10 h-10 text-white" />
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">{t("title")}</h2>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">{t("description")}</p>

            {/* Features list */}
            <div className="space-y-4">
              {pillar.features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${pillar.gradient} flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Visual side */}
          <motion.div
            initial={{ opacity: 0, x: isReversed ? -50 : 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`relative ${isReversed ? "lg:col-start-1 lg:row-start-1" : ""}`}
          >
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Decorative circles */}
              <motion.div
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${pillar.gradient} opacity-10 blur-3xl`}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-8 rounded-full border-2 border-dashed border-white/10"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-16 rounded-full border border-white/5"
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              />

              {/* Center element */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center shadow-2xl`}
                  animate={{
                    boxShadow: [
                      "0 0 30px rgba(168, 85, 247, 0.3)",
                      "0 0 60px rgba(168, 85, 247, 0.5)",
                      "0 0 30px rgba(168, 85, 247, 0.3)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  whileHover={{ scale: 1.1, rotate: 10 }}
                >
                  <pillar.icon className="w-16 h-16 text-white" />
                </motion.div>
              </div>

              {/* Orbiting elements */}
              {pillar.features.map((feature, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    top: "50%",
                    left: "50%",
                  }}
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 15 + i * 5,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 2,
                  }}
                >
                  <motion.div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center shadow-lg`}
                    style={{
                      transform: `translateX(${120 + i * 30}px) translateY(-50%)`,
                    }}
                    whileHover={{ scale: 1.2 }}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Process section
function ProcessSection() {
  const t = useTranslations("WhatWeDo.Process");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    { icon: Headphones, number: "01" },
    { icon: Target, number: "02" },
    { icon: Code, number: "03" },
    { icon: Rocket, number: "04" },
  ];

  return (
    <section ref={ref} className="py-24 relative bg-gradient-to-b from-transparent via-purple-900/5 to-transparent">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <Workflow className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">{t("badge")}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">{t("title")}</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">{t("subtitle")}</p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-24 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 opacity-30" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative text-center"
            >
              {/* Step circle */}
              <motion.div
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 flex items-center justify-center relative z-10"
                whileHover={{ scale: 1.1 }}
              >
                <step.icon className="w-8 h-8 text-white" />
              </motion.div>

              {/* Number */}
              <div className="text-6xl font-bold text-white/5 absolute -top-4 left-1/2 -translate-x-1/2">
                {step.number}
              </div>

              <h3 className="text-xl font-semibold text-white mb-2">{t(`steps.${i}.title`)}</h3>
              <p className="text-gray-400">{t(`steps.${i}.description`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA section
function CTASection() {
  const t = useTranslations("WhatWeDo.CTA");

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/20 to-purple-900/30" />

      <motion.div
        className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[150px]"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[150px]"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 12, repeat: Infinity, delay: 3 }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block mb-6"
          >
            <Rocket className="w-16 h-16 text-purple-400" />
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">{t("title")}</h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">{t("subtitle")}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-lg px-10 py-7">
                {t("cta.primary")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/agendar-consultoria">
              <Button size="lg" variant="outline" className="text-lg px-10 py-7 border-white/20 hover:bg-white/10">
                {t("cta.secondary")}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Main page component
export default function WhatWeDoPage() {
  const t = useTranslations("WhatWeDo.Pillars");

  const pillars = [
    {
      id: "webProduct",
      icon: LayoutDashboard,
      gradient: "from-fuchsia-500 via-purple-500 to-indigo-500",
      features: [
        { icon: Monitor, title: t("webProduct.features.performance.title"), description: t("webProduct.features.performance.description") },
        { icon: CheckCircle2, title: t("webProduct.features.seo.title"), description: t("webProduct.features.seo.description") },
        { icon: Code, title: t("webProduct.features.cms.title"), description: t("webProduct.features.cms.description") },
        { icon: MapPin, title: t("webProduct.features.googleMaps.title"), description: t("webProduct.features.googleMaps.description") },
        { icon: Mail, title: t("webProduct.features.workspace.title"), description: t("webProduct.features.workspace.description") },
      ],
    },
    {
      id: "automation",
      icon: Workflow,
      gradient: "from-blue-500 via-cyan-500 to-emerald-500",
      features: [
        { icon: Workflow, title: t("automation.features.workflows.title"), description: t("automation.features.workflows.description") },
        { icon: MessageSquare, title: t("automation.features.bots.title"), description: t("automation.features.bots.description") },
        { icon: Shield, title: t("automation.features.monitoring.title"), description: t("automation.features.monitoring.description") },
        { icon: Zap, title: t("automation.features.integrations.title"), description: t("automation.features.integrations.description") },
      ],
    },
    {
      id: "aiTraining",
      icon: Brain,
      gradient: "from-amber-400 via-orange-500 to-rose-500",
      features: [
        { icon: Target, title: t("aiTraining.features.diagnostic.title"), description: t("aiTraining.features.diagnostic.description") },
        { icon: Bot, title: t("aiTraining.features.agents.title"), description: t("aiTraining.features.agents.description") },
        { icon: Cpu, title: t("aiTraining.features.chatgptAoe.title"), description: t("aiTraining.features.chatgptAoe.description") },
        { icon: Lightbulb, title: t("aiTraining.features.training.title"), description: t("aiTraining.features.training.description") },
      ],
    },
    {
      id: "contentVideo",
      icon: Clapperboard,
      gradient: "from-emerald-400 via-teal-400 to-sky-300",
      features: [
        { icon: Video, title: t("contentVideo.features.motion.title"), description: t("contentVideo.features.motion.description") },
        { icon: LayoutDashboard, title: t("contentVideo.features.kits.title"), description: t("contentVideo.features.kits.description") },
        { icon: Rocket, title: t("contentVideo.features.packs.title"), description: t("contentVideo.features.packs.description") },
        { icon: Target, title: t("contentVideo.features.ads.title"), description: t("contentVideo.features.ads.description") },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <HeroSection />
        <MissionSection />
        <PipelineSection />
        {pillars.map((pillar, i) => (
          <PillarDetailSection key={pillar.id} pillar={pillar} index={i} />
        ))}
        <ProcessSection />
        <OutcomesSection />
        <StacksSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
