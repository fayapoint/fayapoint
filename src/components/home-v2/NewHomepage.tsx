"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Sparkles, BookOpen, Award, Zap,
  ChevronDown, Play, Clock, Star, Code,
} from "lucide-react";
import { allCourses, CourseData, getFeaturedCourses } from "@/data/courses";
import { useUser } from "@/contexts/UserContext";

interface HomepageStats {
  totalUsers: number;
  totalCertificates: number;
  totalCourses: number;
  totalChapters: number;
}

interface MonthlyOffer {
  monthKey: string;
  freeCourse: { slug: string; title: string; level: string } | null;
}

// ─── Animated Counter ───────────────────────────────────────────
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || target === 0) return;
    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── Service Cards Data ─────────────────────────────────────────
const services = [
  {
    icon: Code, title: "Construção de Sites",
    desc: "Sites modernos com Next.js, React e IA integrada. Do design ao deploy.",
    href: "/servicos/construcao-de-sites", color: "from-amber-500/20 to-amber-500/5",
  },
  {
    icon: Zap, title: "Automação com IA",
    desc: "Conecte ferramentas e automatize processos com N8N, Make e agentes.",
    href: "/servicos/automacao-e-integracao", color: "from-cyan-500/20 to-cyan-500/5",
  },
  {
    icon: Sparkles, title: "Consultoria IA",
    desc: "Diagnóstico e implementação de IA personalizada para seu negócio.",
    href: "/servicos/consultoria-ai", color: "from-yellow-500/20 to-yellow-500/5",
  },
  {
    icon: Play, title: "Edição de Vídeo",
    desc: "Produção de conteúdo visual com ferramentas de IA de última geração.",
    href: "/servicos/edicao-de-video", color: "from-amber-500/20 to-amber-500/5",
  },
];

// ─── Main Homepage Component ────────────────────────────────────
export function NewHomepage() {
  const { user } = useUser();
  const [stats, setStats] = useState<HomepageStats | null>(null);
  const [monthlyOffer, setMonthlyOffer] = useState<MonthlyOffer | null>(null);
  const [freeCourse, setFreeCourse] = useState<CourseData | null>(null);
  const [activeService, setActiveService] = useState(0);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  // Fetch real stats
  useEffect(() => {
    fetch("/api/public/homepage-stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats({ totalUsers: 0, totalCertificates: 0, totalCourses: allCourses.length, totalChapters: 0 }));
  }, []);

  // Fetch monthly offer
  useEffect(() => {
    fetch("/api/courses/monthly-offers")
      .then((r) => r.json())
      .then((data) => {
        setMonthlyOffer(data);
        if (data?.freeCourse?.slug) {
          const found = allCourses.find((c) => c.slug === data.freeCourse.slug);
          if (found) setFreeCourse(found);
        }
      })
      .catch(() => {});
  }, []);

  const featured = getFeaturedCourses().slice(0, 6);

  return (
    <div className="relative bg-[#030712] text-white overflow-hidden">
      {/* ═══ HERO ═══ */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 md:px-12"
      >
        {/* Animated orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-600/20 rounded-full blur-[120px] animate-[float_20s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-600/15 rounded-full blur-[120px] animate-[float_25s_ease-in-out_infinite_5s]" />
          <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-[100px] animate-[float_18s_ease-in-out_infinite_10s]" />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, black, transparent)",
          }}
        />

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Badge */}
          {freeCourse && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-secondary border border-border text-sm text-slate-300"
            >
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Grátis este mês: {freeCourse.title}
            </motion.div>
          )}

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight leading-[0.95]"
          >
            <span className="block text-white">Domine a IA.</span>
            <span className="block bg-gradient-to-r from-amber-400 via-yellow-400 to-cyan-400 bg-clip-text text-transparent">
              Comece grátis.
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-lg md:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed"
          >
            {stats?.totalCourses || allCourses.length} cursos práticos.{" "}
            {stats?.totalChapters || "256"} capítulos.{" "}
            40+ ferramentas de IA. Um curso grátis todo mês.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href={user ? "/portal" : "/registro"}
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-700 text-white font-semibold text-lg shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:shadow-[0_0_60px_rgba(139,92,246,0.5)] transition-all hover:-translate-y-0.5"
            >
              {user ? "Ir para o Portal" : "Começar Grátis"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/cursos"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-border text-white font-medium text-lg hover:bg-secondary transition-all"
            >
              <BookOpen className="w-5 h-5" />
              Explorar cursos
            </Link>
          </motion.div>

          {/* Trust line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 text-sm text-slate-500"
          >
            Sem cartão de crédito · Login com Google · 100% em português
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <Link
              href="/descobrir#proposta"
              className="mt-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-amber-400 transition-colors"
            >
              Conheça nossa proposta <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </div>

        {/* Stats strip at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-10 md:gap-16 z-10"
        >
          {[
            { value: stats?.totalCourses || allCourses.length, label: "Cursos", suffix: "" },
            { value: stats?.totalChapters || 0, label: "Capítulos", suffix: "" },
            { value: stats?.totalUsers || 0, label: "Alunos", suffix: "" },
            { value: stats?.totalCertificates || 0, label: "Certificados", suffix: "" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl md:text-3xl font-extrabold text-white">
                {s.value > 0 ? <AnimatedCounter target={s.value} suffix={s.suffix} /> : "—"}
              </div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 animate-bounce"
        >
          <ChevronDown className="w-5 h-5 text-slate-600" />
        </motion.div>
      </motion.section>

      {/* ═══ FREE COURSE SPOTLIGHT ═══ */}
      {freeCourse && (
        <section className="py-20 px-6 md:px-12">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-2xl border border-border bg-white/[0.02] backdrop-blur-sm p-8 md:p-12 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-amber-500/5 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold mb-4">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    GRÁTIS ESTE MÊS
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-3">{freeCourse.title}</h2>
                  <p className="text-slate-400 text-lg mb-6 leading-relaxed">{freeCourse.shortDescription}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-6">
                    <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {freeCourse.totalLessons} capítulos</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {freeCourse.duration}</span>
                    <span className="flex items-center gap-1"><Award className="w-4 h-4" /> Certificado incluso</span>
                  </div>
                  <Link
                    href={`/curso/${freeCourse.slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold shadow-lg hover:shadow-green-500/20 transition-all hover:-translate-y-0.5"
                  >
                    Começar Agora — É Grátis
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="text-center flex-shrink-0">
                  <div className="text-7xl mb-2">🤖</div>
                  <div className="text-sm text-slate-500">Sem cartão · Acesso completo</div>
                  <Link
                    href="/descobrir#curso-gratis"
                    className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-green-400 transition-colors"
                  >
                    Mais sobre a oferta <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══ COURSES BENTO GRID ═══ */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 mb-3">Nossos Cursos</p>
            <h2 className="text-4xl md:text-5xl font-bold">Aprenda por ferramenta</h2>
            <p className="mt-4 text-slate-400 text-lg max-w-lg mx-auto">
              Cada curso cobre uma ferramenta de IA do zero ao avançado
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((course, i) => (
              <motion.div
                key={course.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={`/curso/${course.slug}`}
                  className="group block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center text-lg">
                      {course.tool === "ChatGPT" ? "🤖" : course.tool === "Claude" ? "💜" : course.tool === "Midjourney" ? "🎨" : course.tool === "N8N" ? "⚡" : course.tool === "Make" ? "🚀" : "✨"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-amber-300 transition-colors">{course.title}</h3>
                      <p className="text-xs text-slate-500">{course.tool} · {course.level}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4">{course.shortDescription}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{course.totalLessons} capítulos</span>
                    <span>{course.duration}</span>
                    {course.rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {course.rating}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10 flex flex-col items-center gap-3">
            <Link
              href="/cursos"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-white font-medium hover:bg-secondary transition-all"
            >
              Ver todos os {allCourses.length} cursos
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/descobrir#cursos"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-cyan-400 transition-colors"
            >
              Ver por categorias e níveis <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ SERVICES ═══ */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400 mb-3">Serviços</p>
            <h2 className="text-4xl md:text-5xl font-bold">Além dos cursos</h2>
            <p className="mt-4 text-slate-400 text-lg max-w-lg mx-auto">
              Construímos, automatizamos e consultamos — tudo com IA
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((svc, i) => (
              <motion.div
                key={svc.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={svc.href}
                  className="group block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1 overflow-hidden relative"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${svc.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative z-10">
                    <svc.icon className="w-8 h-8 text-slate-400 group-hover:text-white mb-4 transition-colors" />
                    <h3 className="text-xl font-bold mb-2">{svc.title}</h3>
                    <p className="text-slate-400 text-sm">{svc.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/descobrir#servicos"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-yellow-400 transition-colors"
            >
              Conheça todos os nossos serviços <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ AI TOOLS MARQUEE ═══ */}
      <section className="py-16 overflow-hidden">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-400 mb-3">Ferramentas</p>
          <h2 className="text-3xl md:text-4xl font-bold">40+ ferramentas de IA</h2>
        </div>
        <div className="relative">
          <div className="flex gap-4 animate-[marquee_30s_linear_infinite]">
            {[...allCourses, ...allCourses].map((c, i) => (
              <div
                key={`${c.slug}-${i}`}
                className="flex-shrink-0 px-5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm text-slate-300 whitespace-nowrap"
              >
                {c.tool}
              </div>
            ))}
          </div>
        </div>
        <div className="text-center mt-8">
          <Link
            href="/descobrir#ferramentas"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-amber-400 transition-colors"
          >
            Explore todas as ferramentas <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-24 px-6 md:px-12 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-amber-600/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Pronto para{" "}
              <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-cyan-400 bg-clip-text text-transparent">
                dominar a IA?
              </span>
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Crie sua conta grátis e comece a aprender em 2 minutos.
            </p>
            <Link
              href={user ? "/portal" : "/registro"}
              className="inline-flex items-center gap-2 px-10 py-5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-700 text-white font-bold text-lg shadow-[0_0_50px_rgba(139,92,246,0.3)] hover:shadow-[0_0_80px_rgba(139,92,246,0.5)] transition-all hover:-translate-y-1"
            >
              {user ? "Ir para o Portal" : "Criar Conta Grátis"}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-sm text-slate-500">
              Sem cartão · Login com Google · Cancele quando quiser
            </p>
            <Link
              href="/descobrir#comece-agora"
              className="mt-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-cyan-400 transition-colors"
            >
              Ver tudo que oferecemos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
