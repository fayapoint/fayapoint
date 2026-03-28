"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from "framer-motion";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Play,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Zap,
  BookOpen,
  Brain,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { useLocale, useTranslations } from "next-intl";

// Lazy-load the heavy 3D components
const Scene = dynamic(
  () => import("@/components/3d/Scene").then((mod) => ({ default: mod.Scene })),
  { ssr: false }
);
const HeroScene = dynamic(
  () => import("@/components/3d/HeroScene").then((mod) => ({ default: mod.HeroScene })),
  { ssr: false }
);

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function Hero3D() {
  const { user, isLoggedIn, mounted: userMounted } = useUser();
  const t = useTranslations("Home.Hero");
  const locale = useLocale();

  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [studentsCount, setStudentsCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);

  const formatNumber = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const headlinePrefix =
    userMounted && isLoggedIn && user
      ? t("headline.prefixLogged", { name: user.name.split(" ")[0] })
      : t("headline.prefix");

  const subheadingContent =
    userMounted && isLoggedIn && user
      ? t.rich("subheading.returning", {
          name: user.name.split(" ")[0],
          primary: (chunks) => (
            <span className="text-primary font-semibold">{chunks}</span>
          ),
          accent: (chunks) => (
            <span className="text-accent font-bold">{chunks}</span>
          ),
        })
      : t.rich("subheading.guest", {
          primary: (chunks) => (
            <span className="text-primary font-semibold">{chunks}</span>
          ),
          accent: (chunks) => (
            <span className="text-accent font-bold">{chunks}</span>
          ),
        });

  const stats = [
    { icon: BookOpen, color: "amber", value: coursesCount, label: t("stats.courses"), suffix: "" },
    { icon: Brain, color: "pink", value: studentsCount, label: locale === "pt-BR" ? "Aulas Praticas" : "Practical Lessons", suffix: "+" },
    { icon: Cpu, color: "yellow", value: completionRate, label: locale === "pt-BR" ? "Ferramentas de IA" : "AI Tools", suffix: "+" },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animated counters
  useEffect(() => {
    const t1 = setInterval(() => setStudentsCount((p) => (p < 500 ? p + 10 : 500)), 30);
    const t2 = setInterval(() => setCoursesCount((p) => (p < 18 ? p + 1 : 18)), 80);
    const t3 = setInterval(() => setCompletionRate((p) => (p < 50 ? p + 1 : 50)), 40);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, []);

  // GSAP staggered entrance animations
  useGSAP(
    () => {
      if (!mounted) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        badgeRef.current,
        { opacity: 0, y: 30, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8 }
      )
        .fromTo(
          headlineRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 1 },
          "-=0.4"
        )
        .fromTo(
          subRef.current,
          { opacity: 0, y: 30, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8 },
          "-=0.5"
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.4"
        )
        .fromTo(
          statsRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.3"
        );
    },
    { scope: containerRef, dependencies: [mounted] }
  );

  // Scroll-driven parallax for the text layer
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const textY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative z-0 min-h-[110vh] flex items-center justify-center overflow-hidden"
      style={{ background: "#030712" }}
    >
      {/* 3D Background Canvas */}
      {mounted && (
        <div className="absolute inset-0 z-0">
          <Scene camera={{ position: [0, 0, 5], fov: 75 }}>
            <HeroScene />
          </Scene>
        </div>
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-transparent to-[#030712]" />
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_30%,#030712_80%)]" />

      {/* HTML Content Layer */}
      <motion.div
        className="container mx-auto px-4 relative z-10 pt-24"
        style={{ y: textY, opacity: textOpacity }}
      >
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div ref={badgeRef} className="inline-block mb-8 opacity-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-yellow-600/20 blur-xl" />
              <div className="relative backdrop-blur-xl bg-secondary border border-border rounded-full px-6 py-3 flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </motion.div>
                <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent font-semibold">
                  {t("badge")}
                </span>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="w-4 h-4 text-yellow-400" />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1
            ref={headlineRef}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight opacity-0"
          >
            <span className="inline-block text-white/90">
              {headlinePrefix}{" "}
            </span>
            <span className="relative inline-block">
              <span className="absolute inset-0 -z-10 blur-2xl opacity-60 bg-gradient-to-r from-amber-500/40 via-pink-500/40 to-cyan-500/40" />
              <span
                className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-400 to-cyan-400 animate-gradient-x"
                style={{
                  backgroundSize: "200% 100%",
                  animation: "gradient-x 4s linear infinite",
                }}
              >
                {t("headline.highlight")}
              </span>
            </span>
            <br />
            <span className="inline-block text-white/90">
              {t("headline.suffix")}
            </span>
          </h1>

          {/* Subheading */}
          <div ref={subRef} className="mb-10 max-w-3xl mx-auto opacity-0">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 to-yellow-600/10 blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative backdrop-blur-md bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                <p className="text-xl text-white/80 font-medium leading-relaxed">
                  {subheadingContent}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row gap-6 justify-center mb-12 opacity-0">
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link href="/aula-gratis">
                <Button
                  size="lg"
                  className="relative bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-500 hover:to-yellow-500 text-white text-lg px-10 py-7 group overflow-hidden border-0 shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                >
                  <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative flex items-center">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                      <Play className="mr-2" />
                    </motion.div>
                    {t("cta.watchClass")}
                  </span>
                </Button>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link href="/cursos">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-600/50 to-cyan-600/50 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-10 py-7 border-2 border-white/20 hover:border-white/40 hover:bg-secondary text-white"
                  >
                    {t("cta.viewCourses")}
                    <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <ArrowRight className="ml-2" />
                    </motion.div>
                  </Button>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Stats */}
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto opacity-0">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-amber-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                <div className="relative backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, delay: index * 0.5 }}
                    >
                      <stat.icon size={24} className="text-amber-400" />
                    </motion.div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {formatNumber.format(stat.value)}{stat.suffix}
                      </div>
                      <div className="text-sm text-white/50 font-medium">{stat.label}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="text-white/40 w-6 h-6" />
        </motion.div>
      </motion.div>
    </section>
  );
}
