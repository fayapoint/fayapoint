"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  Brain,
  Sparkles,
  Zap,
  Lock,
  Unlock,
  Shield,
  ArrowRight,
  BookOpen,
  Palette,
  Award,
  Users,
  Play,
  CheckCircle,
  Star,
  Clock,
  TrendingUp,
  Cpu,
  Globe,
  Code,
  Eye,
  ChevronDown,
} from "lucide-react";
import { useTranslations } from "next-intl";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

export function GateLandingPage() {
  const t = useTranslations("Gate");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [liveViewers, setLiveViewers] = useState(0);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  const gateRef = useRef<HTMLDivElement>(null);

  // Parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const bgX = useSpring(useTransform(mouseX, [-500, 500], [-15, 15]), { stiffness: 100, damping: 30 });
  const bgY = useSpring(useTransform(mouseY, [-500, 500], [-15, 15]), { stiffness: 100, damping: 30 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  }, [mouseX, mouseY]);

  // Mount + animated counters
  useEffect(() => {
    setMounted(true);
    // Simulate today's verified count (realistic range)
    const base = 247 + Math.floor(Math.random() * 80);
    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(current + Math.ceil(base / 40), base);
      setTodayCount(current);
      if (current >= base) clearInterval(interval);
    }, 50);

    // Live viewers
    setLiveViewers(12 + Math.floor(Math.random() * 18));
    const viewerInterval = setInterval(() => {
      setLiveViewers(prev => Math.max(8, prev + (Math.random() > 0.5 ? 1 : -1)));
    }, 5000);

    return () => { clearInterval(interval); clearInterval(viewerInterval); };
  }, []);

  // Countdown timer (resets every 24h from midnight)
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown({ h, m, s });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load Turnstile script
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already loaded
    if (window.turnstile) {
      renderTurnstile();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => {
      renderTurnstile();
    };
    document.head.appendChild(script);

    return () => {
      if (turnstileWidgetId.current && window.turnstile) {
        try { window.turnstile.remove(turnstileWidgetId.current); } catch {}
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderTurnstile() {
    if (!turnstileRef.current || !window.turnstile) return;
    if (turnstileWidgetId.current) return;

    turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: "dark",
      size: "normal",
      callback: (token: string) => {
        setTurnstileToken(token);
      },
      "expired-callback": () => {
        setTurnstileToken(null);
      },
      "error-callback": () => {
        setTurnstileToken(null);
      },
    });
  }

  async function handleEnter() {
    if (!turnstileToken || isVerifying) return;
    setIsVerifying(true);
    setIsEntering(true);

    try {
      const res = await fetch("/api/gate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: turnstileToken }),
      });

      if (res.ok) {
        // Small delay for the cinematic transition
        await new Promise(r => setTimeout(r, 800));
        window.location.reload();
      } else {
        setIsEntering(false);
        setIsVerifying(false);
        // Reset turnstile
        if (turnstileWidgetId.current && window.turnstile) {
          window.turnstile.reset(turnstileWidgetId.current);
        }
        setTurnstileToken(null);
      }
    } catch {
      setIsEntering(false);
      setIsVerifying(false);
    }
  }

  function scrollToGate() {
    gateRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  // Features the user gets for free
  const freeFeatures = [
    { icon: BookOpen, color: "from-purple-500 to-violet-600" },
    { icon: Sparkles, color: "from-cyan-500 to-blue-600" },
    { icon: Palette, color: "from-pink-500 to-rose-600" },
    { icon: Award, color: "from-amber-500 to-orange-600" },
    { icon: Zap, color: "from-green-500 to-emerald-600" },
    { icon: Globe, color: "from-indigo-500 to-purple-600" },
  ];

  // Blurred teaser cards
  const teaserCards = [
    { icon: Brain, gradient: "from-purple-600/30 to-pink-600/30" },
    { icon: Code, gradient: "from-blue-600/30 to-cyan-600/30" },
    { icon: Cpu, gradient: "from-green-600/30 to-emerald-600/30" },
    { icon: TrendingUp, gradient: "from-orange-600/30 to-amber-600/30" },
  ];

  return (
    <AnimatePresence>
      {isEntering && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-4 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
            />
            <p className="text-white text-xl font-medium">{t("entering")}</p>
          </motion.div>
        </motion.div>
      )}

      <div
        className="min-h-screen bg-[#030108] text-white overflow-x-hidden selection:bg-purple-500/30"
        onMouseMove={handleMouseMove}
      >
        {/* ================================================================ */}
        {/* SECTION 1: HERO - Full viewport cinematic intro */}
        {/* ================================================================ */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
          {/* Animated mesh background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,40,200,0.15),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(200,40,120,0.1),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(40,120,200,0.08),transparent_60%)]" />

            {/* Animated orbs */}
            <motion.div
              style={{ x: bgX, y: bgY }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full bg-purple-600/20 blur-[120px]"
            />
            <motion.div
              style={{ x: useTransform(bgX, v => -v * 0.5), y: useTransform(bgY, v => -v * 0.5) }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
              className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-pink-600/15 blur-[150px]"
            />

            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.15)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
              }}
            />

            {/* Floating particles */}
            {mounted && Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${(i * 5 + 3) % 95}%`,
                  top: `${(i * 7 + 2) % 95}%`,
                  width: `${2 + (i % 3)}px`,
                  height: `${2 + (i % 3)}px`,
                  background: i % 3 === 0
                    ? "rgba(168,85,247,0.5)"
                    : i % 3 === 1
                    ? "rgba(236,72,153,0.5)"
                    : "rgba(6,182,212,0.4)",
                }}
                animate={{
                  y: [-15, 15, -15],
                  opacity: [0.2, 0.6, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 6 + (i % 5) * 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Floating tech icons */}
          <motion.div
            className="absolute top-24 left-[8%] text-purple-500/15"
            animate={{ y: [0, -20, 0], rotate: [0, 15, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Brain size={70} />
          </motion.div>
          <motion.div
            className="absolute top-[35%] right-[6%] text-pink-500/15"
            animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          >
            <Cpu size={55} />
          </motion.div>
          <motion.div
            className="absolute bottom-[25%] left-[5%] text-cyan-500/15"
            animate={{ x: [0, 15, 0], rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Code size={45} />
          </motion.div>

          {/* Content */}
          <div className="relative z-10 max-w-5xl mx-auto text-center">
            {/* Live badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 mb-8"
            >
              <div className="relative flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span className="text-sm font-medium text-green-400">
                  {mounted ? liveViewers : "--"} {t("hero.liveNow")}
                </span>
                <span className="w-px h-4 bg-white/20" />
                <Eye className="w-3.5 h-3.5 text-white/50" />
                <span className="text-sm text-white/60">
                  {mounted ? todayCount.toLocaleString() : "---"} {t("hero.todayVerified")}
                </span>
              </div>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] mb-6 tracking-tight"
            >
              <span className="block text-white/90">{t("hero.line1")}</span>
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                {t("hero.line2")}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-lg sm:text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed font-light"
            >
              {t("hero.subtitle")}
            </motion.p>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-12"
            >
              {[
                { value: "18", label: t("hero.stat1"), icon: BookOpen },
                { value: "500+", label: t("hero.stat2"), icon: Play },
                { value: "100+", label: t("hero.stat3"), icon: Sparkles },
                { value: "4.9", label: t("hero.stat4"), icon: Star },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm"
                >
                  <stat.icon className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-white">{stat.value}</span>
                  <span className="text-white/50 text-sm">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA to scroll */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <motion.button
                onClick={scrollToGate}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg text-white overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />
                <div className="absolute inset-[1px] rounded-2xl bg-[#0a0515] group-hover:bg-transparent transition-all duration-300" />
                <span className="relative flex items-center gap-3">
                  <Lock className="w-5 h-5" />
                  {t("hero.cta")}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <ChevronDown className="w-6 h-6 text-white/30" />
            </motion.div>
          </motion.div>
        </section>

        {/* ================================================================ */}
        {/* SECTION 2: BLURRED PREVIEW - What's behind the gate */}
        {/* ================================================================ */}
        <section className="relative py-20 sm:py-28 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent" />

          <div className="relative z-10 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/20 bg-purple-500/10 mb-6">
                <Eye className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">{t("preview.badge")}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                <span className="text-white">{t("preview.title1")}</span>{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {t("preview.title2")}
                </span>
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">{t("preview.subtitle")}</p>
            </motion.div>

            {/* Blurred teaser grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12">
              {teaserCards.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative"
                >
                  <div className={`relative aspect-[4/3] rounded-2xl bg-gradient-to-br ${card.gradient} border border-white/5 overflow-hidden`}>
                    {/* Blurred content simulation */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <card.icon className="w-12 h-12 text-white/20" />
                    </div>
                    <div className="absolute inset-0 backdrop-blur-md bg-black/30" />

                    {/* Lock overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                      >
                        <Lock className="w-8 h-8 text-white/40" />
                      </motion.div>
                      <span className="text-xs text-white/40 font-medium">{t(`preview.card${i + 1}`)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Blurred screenshot with overlay */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative rounded-2xl overflow-hidden border border-white/10 max-w-4xl mx-auto"
            >
              <img
                src="/ainxecond1.png"
                alt="Platform preview"
                className="w-full h-auto blur-lg scale-105 opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030108] via-black/60 to-black/40 flex flex-col items-center justify-center gap-4">
                <Lock className="w-12 h-12 text-white/30" />
                <p className="text-white/60 text-lg font-medium text-center px-4">{t("preview.locked")}</p>
                <motion.button
                  onClick={scrollToGate}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 rounded-full bg-purple-600/80 hover:bg-purple-600 text-white font-medium text-sm transition-all"
                >
                  {t("preview.unlockCta")}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* SECTION 3: WHAT YOU GET FOR FREE */}
        {/* ================================================================ */}
        <section className="relative py-20 sm:py-28 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-950/5 to-transparent" />

          <div className="relative z-10 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/20 bg-green-500/10 mb-6">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-300">{t("free.badge")}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white">
                {t("free.title")}
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">{t("free.subtitle")}</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {freeFeatures.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group relative p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/15 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{t(`free.feature${i + 1}.title`)}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{t(`free.feature${i + 1}.desc`)}</p>
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-xs font-bold">{t("free.freeLabel")}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* SECTION 4: FOMO + URGENCY */}
        {/* ================================================================ */}
        <section className="relative py-16 sm:py-20 px-4">
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {/* Urgency countdown */}
              <div className="inline-flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold text-sm uppercase tracking-wider">{t("fomo.urgencyLabel")}</span>
                </div>
                <div className="flex items-center gap-3">
                  {[
                    { val: pad(countdown.h), label: t("fomo.hours") },
                    { val: pad(countdown.m), label: t("fomo.minutes") },
                    { val: pad(countdown.s), label: t("fomo.seconds") },
                  ].map((unit, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div className="text-3xl sm:text-4xl font-mono font-bold text-white bg-white/5 border border-white/10 rounded-xl px-4 py-2 min-w-[70px]">
                          {mounted ? unit.val : "--"}
                        </div>
                        <span className="text-xs text-white/40 mt-1">{unit.label}</span>
                      </div>
                      {i < 2 && <span className="text-2xl font-bold text-white/20 mb-4">:</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Social proof */}
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-white/70">
                    <strong className="text-white">{mounted ? todayCount.toLocaleString() : "---"}</strong> {t("fomo.verifiedToday")}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white/70">{t("fomo.growing")}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-white/70">{t("fomo.rating")}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* SECTION 5: THE GATE - Captcha + Enter */}
        {/* ================================================================ */}
        <section ref={gateRef} className="relative py-20 sm:py-28 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-[#030108]" />

          <div className="relative z-10 max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Glow effect behind card */}
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 rounded-3xl blur-2xl" />

              <div className="relative bg-[#0a0818]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 text-center">
                {/* Lock icon with animation */}
                <motion.div
                  animate={turnstileToken ? { rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
                  style={{
                    background: turnstileToken
                      ? "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))"
                      : "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.1))",
                    border: turnstileToken
                      ? "1px solid rgba(34,197,94,0.3)"
                      : "1px solid rgba(168,85,247,0.2)",
                  }}
                >
                  {turnstileToken ? (
                    <Unlock className="w-10 h-10 text-green-400" />
                  ) : (
                    <Shield className="w-10 h-10 text-purple-400" />
                  )}
                </motion.div>

                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  {turnstileToken ? t("gate.titleReady") : t("gate.title")}
                </h2>
                <p className="text-white/50 mb-8">
                  {turnstileToken ? t("gate.subtitleReady") : t("gate.subtitle")}
                </p>

                {/* Turnstile widget */}
                <div className="flex justify-center mb-6">
                  <div ref={turnstileRef} />
                </div>

                {/* Enter button */}
                <motion.button
                  onClick={handleEnter}
                  disabled={!turnstileToken || isVerifying}
                  whileHover={turnstileToken ? { scale: 1.03, y: -2 } : {}}
                  whileTap={turnstileToken ? { scale: 0.98 } : {}}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                    turnstileToken
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-600/25 hover:shadow-purple-600/40 cursor-pointer"
                      : "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
                  }`}
                >
                  {isVerifying ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      {t("gate.verifying")}
                    </>
                  ) : turnstileToken ? (
                    <>
                      <Unlock className="w-5 h-5" />
                      {t("gate.enterCta")}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      {t("gate.waitingCta")}
                    </>
                  )}
                </motion.button>

                {/* Trust indicators */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6">
                  <span className="text-xs text-white/30 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> {t("gate.trust1")}
                  </span>
                  <span className="text-xs text-white/30 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {t("gate.trust2")}
                  </span>
                  <span className="text-xs text-white/30 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {t("gate.trust3")}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Minimal footer */}
        <div className="py-6 text-center text-white/20 text-xs">
          <p>&copy; {new Date().getFullYear()} FayAi AI Academy</p>
        </div>
      </div>
    </AnimatePresence>
  );
}

// TypeScript declarations for Turnstile
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: any;
