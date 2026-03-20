"use client";

import { useEffect, useState } from "react";
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
import { useLocale, useTranslations } from "next-intl";
import { useUser } from "@/contexts/UserContext";
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

export function FreeOfferBanner() {
  const t = useTranslations("Home.FreeOffer");
  const locale = useLocale();
  const isPtBr = locale === "pt-BR";
  const { isLoggedIn, mounted, user } = useUser();
  const [monthlyOffers, setMonthlyOffers] = useState<MonthlyOffersResponse | null>(null);

  useEffect(() => {
    async function fetchMonthlyOffers() {
      try {
        const response = await fetch("/api/courses/monthly-offers", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as MonthlyOffersResponse;
        setMonthlyOffers(data);
      } catch (error) {
        console.error("Failed to fetch monthly offers:", error);
      }
    }

    void fetchMonthlyOffers();
  }, []);

  const shouldHide = mounted && isLoggedIn && user?.subscription?.plan && user.subscription.plan !== "free";
  if (shouldHide) return null;

  const freeCourse = monthlyOffers?.freeCourse || null;
  const ctaHref = freeCourse ? `/curso/${freeCourse.slug}` : "/onboarding";
  const benefits = freeCourse
    ? [
        {
          icon: Gift,
          title: isPtBr ? "Curso grátis do mês" : "Free course of the month",
          desc: freeCourse.name,
        },
        {
          icon: Award,
          title: isPtBr ? "Certificado liberado" : "Certificate included",
          desc: isPtBr
            ? "O curso grátis do mês também libera o certificado."
            : "The monthly free course also includes the certificate.",
        },
        {
          icon: BookOpen,
          title: isPtBr ? "Catálogo transparente" : "Transparent monthly catalog",
          desc: isPtBr
            ? `${monthlyOffers?.pools.beginner.length ?? 0} iniciantes, ${monthlyOffers?.pools.intermediate.length ?? 0} intermediários e ${monthlyOffers?.pools.advanced.length ?? 0} avançados neste mês.`
            : `${monthlyOffers?.pools.beginner.length ?? 0} beginner, ${monthlyOffers?.pools.intermediate.length ?? 0} intermediate, and ${monthlyOffers?.pools.advanced.length ?? 0} advanced courses this month.`,
        },
        {
          icon: Sparkles,
          title: isPtBr ? "Experiência completa" : "Full experience",
          desc: isPtBr
            ? "Aula, progresso, certificado e portal sem custo para o curso do mês."
            : "Lessons, progress, certificate, and portal access at no cost for the course of the month.",
        },
        {
          icon: Zap,
          title: isPtBr ? "Rotação automática" : "Automatic rotation",
          desc: isPtBr
            ? "A seleção muda no primeiro dia de cada mês."
            : "Selection rotates automatically on the first day of each month.",
        },
        {
          icon: Crown,
          title: isPtBr ? "Upgrade com contexto" : "Upgrade with context",
          desc: isPtBr
            ? "Depois de testar, o usuário entende exatamente o valor dos planos."
            : "After trying it, users understand exactly what the plans unlock.",
        },
      ]
    : [
        { icon: BookOpen, title: t("benefit1.title"), desc: t("benefit1.desc") },
        { icon: Sparkles, title: t("benefit2.title"), desc: t("benefit2.desc") },
        { icon: Palette, title: t("benefit3.title"), desc: t("benefit3.desc") },
        { icon: Award, title: t("benefit4.title"), desc: t("benefit4.desc") },
        { icon: Zap, title: t("benefit5.title"), desc: t("benefit5.desc") },
        { icon: Crown, title: t("benefit6.title"), desc: t("benefit6.desc") },
      ];


  return (
    <section className="relative overflow-hidden py-16 md:py-20">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,1),rgba(6,95,70,0.08),rgba(3,7,18,1))]" />
      <div className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(3,7,18,0.96))] p-6 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.95fr,1.05fr] lg:items-start">
              <div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2"
                >
                  <Gift className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">{t("badge")}</span>
                </motion.div>

                <h2 className="text-3xl font-black leading-tight text-white md:text-5xl">
                  <span>
                    {freeCourse
                      ? isPtBr
                        ? "Uma oferta real para o usuário sentir o valor da academia"
                        : "A real offer that lets users feel the value of the academy"
                      : t("title1")}
                  </span>{" "}
                  <span className="bg-gradient-to-r from-green-400 to-cyan-300 bg-clip-text text-transparent">
                    {freeCourse
                      ? isPtBr
                        ? "antes de pagar"
                        : "before paying"
                      : t("title2")}
                  </span>
                </h2>

                <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-300">
                  {freeCourse
                    ? isPtBr
                      ? `${freeCourse.name} é o curso grátis do mês. Qualquer usuário pode testar a experiência completa da FayAi, com progresso salvo e certificado incluído.`
                      : `${freeCourse.name} is this month's free course. Any user can try the complete FayAi experience, with saved progress and certificate included.`
                    : t("subtitle")}
                </p>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                        {isPtBr ? "Curso grátis do mês" : "Free course of the month"}
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-white">
                        {freeCourse?.name || (isPtBr ? "Rotação automática ativa" : "Automatic rotation active")}
                      </h3>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Now</p>
                      <p className="text-3xl font-black text-white">R$ 0</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Link href={ctaHref}>
                      <Button
                        size="lg"
                        className="h-13 bg-gradient-to-r from-green-600 to-emerald-600 px-6 text-base shadow-xl shadow-green-600/20 hover:from-green-700 hover:to-emerald-700"
                      >
                        <Gift className="mr-2 h-5 w-5" />
                        {freeCourse
                          ? isLoggedIn
                            ? (isPtBr ? "Ver curso grátis do mês" : "View free course of the month")
                            : (isPtBr ? "Criar conta e liberar grátis" : "Create account and unlock free")
                          : t("cta")}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <p className="flex items-center text-sm text-gray-400">
                      {freeCourse
                        ? isPtBr
                          ? "Sem cartão para o curso do mês. Liberação imediata para quem estiver logado."
                          : "No card required for the course of the month. Instant unlock for logged-in users."
                        : t("noCreditCard")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition-colors hover:border-white/15"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-500/10">
                      <benefit.icon className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{benefit.title}</h3>
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{benefit.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
