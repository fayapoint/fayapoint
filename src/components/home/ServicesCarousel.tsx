"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Monitor, Video, Bot, Workflow, ArrowRight, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

const colorStyles = {
  blue: {
    tileBg: "bg-blue-500/10",
    tileBorder: "border-blue-500/20",
    icon: "text-blue-500",
    glow: "from-blue-500/40 via-sky-400/10 to-transparent",
  },
  pink: {
    tileBg: "bg-pink-500/10",
    tileBorder: "border-pink-500/20",
    icon: "text-pink-500",
    glow: "from-pink-500/40 via-fuchsia-400/10 to-transparent",
  },
  purple: {
    tileBg: "bg-purple-500/10",
    tileBorder: "border-purple-500/20",
    icon: "text-purple-500",
    glow: "from-purple-500/40 via-indigo-500/10 to-transparent",
  },
  orange: {
    tileBg: "bg-orange-500/10",
    tileBorder: "border-orange-500/20",
    icon: "text-orange-500",
    glow: "from-orange-500/40 via-amber-400/10 to-transparent",
  },
} as const;

const services = [
  {
    id: "website-building",
    icon: Monitor,
    color: "blue",
    link: "/servicos/construcao-de-sites",
  },
  {
    id: "video-editing",
    icon: Video,
    color: "pink",
    link: "/servicos/edicao-de-video",
  },
  {
    id: "ai-consulting",
    icon: Bot,
    color: "purple",
    link: "/servicos/consultoria-ai",
  },
  {
    id: "automation",
    icon: Workflow,
    color: "orange",
    link: "/servicos/automacao-e-integracao",
  },
];

type ServiceCopy = {
  title: string;
  description: string;
  summary?: string;
  price?: string;
  bullets?: string[];
};

export function ServicesCarousel() {
  const t = useTranslations("Home.Services");
  const [activeServiceId, setActiveServiceId] = useState<string>(services[0].id);

  const activeService = services.find((service) => service.id === activeServiceId) ?? services[0];
  const serviceCopy = t.raw(`${activeService.id}`) as ServiceCopy;
  const styles = colorStyles[activeService.color as keyof typeof colorStyles];

  return (
    <section className="py-20 bg-background relative overflow-visible z-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          {services.map((service) => {
            const tileStyles = colorStyles[service.color as keyof typeof colorStyles];
            const isActive = service.id === activeServiceId;

            return (
              <div
                key={service.id}
                className="relative"
                onMouseEnter={() => setActiveServiceId(service.id)}
                onFocus={() => setActiveServiceId(service.id)}
              >
                <Link href={service.link} aria-label={t(`${service.id}.title`)}>
                  <motion.div
                    className={`w-24 h-24 rounded-2xl ${tileStyles.tileBg} flex items-center justify-center border ${tileStyles.tileBorder} transition-all duration-300 ${
                      isActive ? "ring-2 ring-offset-2 ring-offset-background ring-white/40" : "shadow-sm"
                    }`}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <service.icon className={`w-10 h-10 ${tileStyles.icon}`} />
                  </motion.div>
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeServiceId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="grid gap-8 lg:grid-cols-[3fr_2fr] items-stretch bg-card/80 border border-border rounded-3xl p-8 md:p-10 relative overflow-hidden"
            >
              <div className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${styles.glow}`} />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-4 rounded-2xl ${styles.tileBg} border ${styles.tileBorder}`}>
                    <activeService.icon className={`w-8 h-8 ${styles.icon}`} />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                      {t("title")}
                    </p>
                    <h3 className="text-2xl md:text-3xl font-semibold">
                      {t(`${activeService.id}.title`)}
                    </h3>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground mb-6">
                  {serviceCopy?.summary ?? t(`${activeService.id}.description`)}
                </p>
                {serviceCopy?.bullets && serviceCopy.bullets.length > 0 && (
                  <ul className="grid sm:grid-cols-2 gap-4">
                    {serviceCopy.bullets.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 className={`w-4 h-4 mt-1 ${styles.icon}`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="relative z-10 flex flex-col justify-between rounded-2xl border border-border/70 bg-background/60 p-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-2">Investimento</p>
                  <p className="text-3xl font-bold mb-6">{serviceCopy?.price ?? "Sob consulta"}</p>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {t(`${activeService.id}.description`)}
                  </div>
                </div>
                <div className="space-y-3 mt-6">
                  <Link href={activeService.link}>
                    <Button className="w-full py-6 text-base">
                      {t("learnMore")}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/agendar-consultoria" className="block">
                    <Button variant="outline" className="w-full py-6 text-base">
                      Agendar consultoria
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
