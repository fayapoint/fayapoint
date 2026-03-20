"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Crown,
  Gift,
  Layers3,
  MessageCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/contexts/UserContext";
import { useLocale } from "next-intl";
import type { Product } from "@/lib/products";

interface MonthlyOffersResponse {
  monthKey: string;
  freeCourse: Product | null;
  pools: {
    beginner: Product[];
    intermediate: Product[];
    advanced: Product[];
  };
}

const statTone = [
  {
    icon: BookOpen,
    value: "25+",
    labelPt: "cursos com conteúdo real",
    labelEn: "courses with real content",
    className: "border-cyan-400/20 bg-cyan-500/10 text-cyan-200",
  },
  {
    icon: Gift,
    value: "1",
    labelPt: "curso grátis completo por mês",
    labelEn: "fully free course each month",
    className: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  },
  {
    icon: Award,
    value: "100%",
    labelPt: "certificado incluído no curso grátis",
    labelEn: "certificate included on the free course",
    className: "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200",
  },
];

export function HeroSection() {
  const { user, isLoggedIn, mounted: userMounted } = useUser();
  const locale = useLocale();
  const isPtBr = locale === "pt-BR";
  const [monthlyOffers, setMonthlyOffers] = useState<MonthlyOffersResponse | null>(null);

  useEffect(() => {
    async function fetchMonthlyOffers() {
      try {
        const response = await fetch("/api/courses/monthly-offers", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as MonthlyOffersResponse;
        setMonthlyOffers(data);
      } catch (error) {
        console.error("Failed to fetch monthly offers for hero:", error);
      }
    }

    void fetchMonthlyOffers();
  }, []);

  const firstName = user?.name?.split(" ")[0] || "Aluno";
  const headlineLineOne =
    userMounted && isLoggedIn && user
      ? isPtBr
        ? `${firstName}, sua próxima vantagem em IA já está pronta`
        : `${firstName}, your next AI advantage is already waiting`
      : isPtBr
        ? "Aprenda IA com clareza, valor real e uma oferta que converte"
        : "Learn AI with clarity, real value, and an offer that converts";
  const headlineLineTwo = isPtBr
    ? "entre grátis, prove o resultado e só então avance de plano"
    : "enter free, prove the result, and only then move up a plan";

  const monthlySummary = useMemo(() => {
    if (!monthlyOffers) {
      return isPtBr
        ? "Todo mês, um curso completo fica gratuito e o restante do catálogo roda por faixa de plano."
        : "Every month one full course becomes free, and the rest of the catalog rotates by plan tier.";
    }

    return isPtBr
      ? `${monthlyOffers.pools.beginner.length} iniciantes, ${monthlyOffers.pools.intermediate.length} intermediários e ${monthlyOffers.pools.advanced.length} avançados compõem a vitrine mensal atual.`
      : `${monthlyOffers.pools.beginner.length} beginner, ${monthlyOffers.pools.intermediate.length} intermediate, and ${monthlyOffers.pools.advanced.length} advanced courses make up the current monthly catalog.`;
  }, [isPtBr, monthlyOffers]);

  const freeCourse = monthlyOffers?.freeCourse || null;

  return (
    <section className="relative overflow-hidden border-b border-white/5 bg-[#030712] pt-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_35%),linear-gradient(180deg,rgba(3,7,18,1),rgba(3,7,18,0.96))]" />
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="container relative z-10 mx-auto px-4 pb-16 pt-10 md:pb-20">
        <div className="grid gap-8 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="space-y-7"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                <Gift size={14} className="mr-2" />
                {isPtBr ? "Curso grátis do mês + certificado" : "Free monthly course + certificate"}
              </Badge>
              <Badge className="border-cyan-400/15 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                <CalendarDays size={14} className="mr-2" />
                {isPtBr ? "Catálogo mensal transparente" : "Transparent monthly catalog"}
              </Badge>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white md:text-6xl xl:text-7xl">
                <span className="block">{headlineLineOne}</span>
                <span className="block bg-gradient-to-r from-emerald-300 via-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
                  {headlineLineTwo}
                </span>
              </h1>

              <p className="max-w-2xl text-lg leading-8 text-gray-300 md:text-xl">
                {isPtBr
                  ? "Descubra o curso gratuito do mês, veja exatamente quais trilhas entram no seu plano agora e transforme a primeira experiência em confiança para continuar aprendendo."
                  : "Discover the monthly free course, see exactly which paths belong to your plan right now, and turn the first experience into confidence to keep learning."}
            </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {statTone.map((stat) => (
                <div
                  key={stat.value + stat.labelPt}
                  className={`relative overflow-hidden rounded-[24px] border p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl ${stat.className}`}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.01))]" />
                  <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                  <div className="relative">
                  <div className="flex items-center gap-2">
                    <stat.icon size={16} />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                      {isPtBr ? "Prova de valor" : "Proof of value"}
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-black text-white">{stat.value}</p>
                  <p className="mt-1 text-sm text-white/75">{isPtBr ? stat.labelPt : stat.labelEn}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href={freeCourse ? `/curso/${freeCourse.slug}` : "/aula-gratis"}>
                <Button size="lg" className="h-14 bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 text-base font-bold text-black shadow-[0_14px_40px_rgba(16,185,129,0.24)] hover:from-emerald-400 hover:to-cyan-400">
                  <Gift className="mr-2 h-5 w-5" />
                  {freeCourse
                    ? isPtBr
                      ? "Liberar curso grátis do mês"
                      : "Unlock this month's free course"
                    : isPtBr
                      ? "Assistir aula gratuita"
                      : "Watch free class"}
                </Button>
              </Link>

              <Link href="/precos">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 border-white/15 bg-white/[0.05] px-8 text-base font-semibold text-white backdrop-blur-xl hover:bg-white/[0.1]"
                >
                  <Crown className="mr-2 h-5 w-5" />
                  {isPtBr ? "Ver planos e catálogo do mês" : "View plans and this month's catalog"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-300" />
                {isPtBr ? "Curso grátis com progresso salvo e acesso imediato" : "Free course with saved progress and instant access"}
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-300" />
                {isPtBr ? "Certificado verificável incluído na oferta mensal" : "Verifiable certificate included in the monthly offer"}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="space-y-4"
          >
            <div className="overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03)_12%,rgba(3,7,18,0.94)_100%)] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
              <div className="absolute inset-x-10 top-0 h-px bg-white/20" />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">
                    {isPtBr ? "Oferta principal do mês" : "Primary offer of the month"}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    {freeCourse?.name || (isPtBr ? "Um curso completo grátis todo mês" : "A full course free every month")}
                  </h2>
                </div>
                <div className="rounded-[22px] border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.2),rgba(16,185,129,0.08))] px-4 py-3 text-right shadow-[0_12px_30px_rgba(16,185,129,0.16)]">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Now</p>
                  <p className="text-3xl font-black text-white">R$ 0</p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-gray-300">
                {freeCourse
                  ? freeCourse.copy?.shortDescription || freeCourse.copy?.subheadline || freeCourse.name
                  : isPtBr
                    ? "Entre, teste a experiência completa da academia e entenda o valor real do restante da oferta."
                    : "Get in, try the full academy experience, and understand the real value of the rest of the offer."}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                    {isPtBr ? "O que está incluso" : "What is included"}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-white/85">
                    <li className="inline-flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-300" />
                      {isPtBr ? "Acesso completo ao curso" : "Full course access"}
                    </li>
                    <li className="inline-flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-300" />
                      {isPtBr ? "Progresso salvo no portal" : "Saved progress in the portal"}
                    </li>
                    <li className="inline-flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-300" />
                      {isPtBr ? "Certificado verificável" : "Verifiable certificate"}
                    </li>
                  </ul>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                    {isPtBr ? "Como o modelo funciona" : "How the model works"}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-white/85">
                    <li className="inline-flex items-center gap-2">
                      <Zap size={14} className="text-cyan-300" />
                      {isPtBr ? "1 curso grátis novo no início de cada mês" : "1 new free course at the start of each month"}
                    </li>
                    <li className="inline-flex items-center gap-2">
                      <Zap size={14} className="text-cyan-300" />
                      {isPtBr ? "Pool rotativo por faixa de plano" : "Rotating pool by plan tier"}
                    </li>
                    <li className="inline-flex items-center gap-2">
                      <Zap size={14} className="text-cyan-300" />
                      {isPtBr ? "Upgrade fica claro antes da compra" : "Upgrade value is clear before purchase"}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm text-gray-300 backdrop-blur-xl">
                <p className="font-semibold text-white">{isPtBr ? "Catálogo atual do mês" : "Current monthly catalog"}</p>
                <p className="mt-1 leading-6">{monthlySummary}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-5 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                  {isPtBr ? "Entrada sem fricção" : "Frictionless entry"}
                </p>
                <h3 className="mt-2 text-xl font-bold text-white">
                  {isPtBr ? "O usuário novo entende o valor antes de pagar" : "New users understand the value before paying"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  {isPtBr
                    ? "Curso grátis, catálogo mensal e upgrade aparecem com contexto, sem telas confusas."
                    : "Free course, monthly catalog, and upgrade appear with context, without confusing screens."}
                </p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-5 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                  {isPtBr ? "Posicionamento" : "Positioning"}
                </p>
                <h3 className="mt-2 text-xl font-bold text-white">
                  {isPtBr ? "Oferta clara, moderna e pronta para vender" : "Clear, modern offer ready to sell"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  {isPtBr
                    ? "A página abre com contexto, confiança e caminho de compra, sem ruído desnecessário."
                    : "The page opens with context, trust, and a buying path, without unnecessary noise."}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
