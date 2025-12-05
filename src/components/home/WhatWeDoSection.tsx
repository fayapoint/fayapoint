"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef, useState, type ElementType } from "react";
import {
  ArrowRight,
  Clapperboard,
  LayoutDashboard,
  PenTool,
  Sparkles,
  Zap,
  Workflow,
  Brain,
  MonitorSmartphone,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

type Capability = {
  id: "webProduct" | "automation" | "aiTraining" | "contentVideo";
  icon: ElementType;
  gradient: string;
  accent: string;
};

const capabilities: Capability[] = [
  {
    id: "webProduct",
    icon: LayoutDashboard,
    gradient: "from-fuchsia-500 via-purple-500 to-indigo-500",
    accent: "fuchsia",
  },
  {
    id: "automation",
    icon: Workflow,
    gradient: "from-blue-500 via-cyan-500 to-emerald-500",
    accent: "cyan",
  },
  {
    id: "aiTraining",
    icon: Brain,
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    accent: "amber",
  },
  {
    id: "contentVideo",
    icon: Clapperboard,
    gradient: "from-emerald-400 via-teal-400 to-sky-300",
    accent: "sky",
  },
];

const capabilityLinks: Record<Capability["id"], string> = {
  webProduct: "/servicos/construcao-de-sites",
  automation: "/servicos/automacao-e-integracao",
  aiTraining: "/servicos/consultoria-ai",
  contentVideo: "/servicos/edicao-de-video",
};

const chips = [
  { key: "web", tone: "from-fuchsia-500 to-purple-500" },
  { key: "automation", tone: "from-blue-500 to-cyan-400" },
  { key: "content", tone: "from-emerald-400 to-teal-500" },
  { key: "ai", tone: "from-amber-400 to-orange-500" },
];

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-white/60">
        {title}
      </p>
      <p className="text-2xl font-semibold text-white mt-2">{value}</p>
    </div>
  );
}

function CapabilityCard({
  capability,
  t,
  active,
  onHover,
}: {
  capability: Capability;
  t: ReturnType<typeof useTranslations>;
  active: boolean;
  onHover: () => void;
}) {
  const Icon = capability.icon;
  const href = capabilityLinks[capability.id];
  return (
    <motion.div
      onMouseEnter={onHover}
      className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden cursor-pointer"
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${capability.gradient} opacity-10`}
      />
      <div className="relative p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${capability.gradient} flex items-center justify-center shadow-lg`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">
              {t("stage.title")}
            </p>
            <h3 className="text-xl font-semibold text-white">
              {t(`capabilities.${capability.id}.title`)}
            </h3>
          </div>
        </div>
        <p className="text-sm text-white/70 leading-relaxed">
          {t(`capabilities.${capability.id}.description`)}
        </p>
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-white/60">
            {t(`capabilities.${capability.id}.metric`)}
          </div>
          <Link
            href={href}
            className="text-sm font-semibold text-white flex items-center gap-2 hover:text-white/80 transition-colors"
          >
            {t(`capabilities.${capability.id}.cta`)}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <motion.div
        className="absolute -right-6 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-30"
        style={{
          background:
            capability.accent === "fuchsia"
              ? "radial-gradient(circle, rgba(232,121,249,0.6), transparent 70%)"
              : capability.accent === "cyan"
                ? "radial-gradient(circle, rgba(56,189,248,0.6), transparent 70%)"
                : capability.accent === "amber"
                  ? "radial-gradient(circle, rgba(251,191,36,0.6), transparent 70%)"
                  : "radial-gradient(circle, rgba(125,211,252,0.6), transparent 70%)",
        }}
        animate={{ scale: active ? [1, 1.08, 1] : 1 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
}

export function WhatWeDoSection() {
  const t = useTranslations("Home.WhatWeDo");
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const [active, setActive] = useState<Capability["id"]>("webProduct");

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-24"
      aria-labelledby="design-operating-system"
    >
      {/* Atmospheric background */}
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.07),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.08),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.06),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(240deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:120px_120px]" />
      </div>

      <div className="container relative z-10 mx-auto grid items-center gap-10 px-4 lg:grid-cols-[1.05fr_1.15fr]">
        {/* Text Column */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
              {t("badge")}
            </span>
          </div>
          <h2
            id="design-operating-system"
            className="text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl"
          >
            <span className="block text-white/90">{t("title")}</span>
            <span className="block bg-gradient-to-r from-fuchsia-400 via-blue-400 to-emerald-300 bg-clip-text text-transparent">
              {t("stage.title")}
            </span>
          </h2>
          <p className="max-w-2xl text-lg text-white/70">
            {t("subtitle")}
          </p>

          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip.key}
                className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${chip.tone} px-3 py-1 text-xs font-semibold text-white/90 shadow-lg shadow-black/20`}
              >
                <PenTool className="h-3.5 w-3.5" />
                {t(`chips.${chip.key}`)}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4">
            <MetricCard title={t("metrics.speed.label")} value={t("metrics.speed.value")} />
            <MetricCard title={t("metrics.consistency.label")} value={t("metrics.consistency.value")} />
            <MetricCard title={t("metrics.launch.label")} value={t("metrics.launch.value")} />
          </div>

          <div className="flex flex-col gap-4 pt-4 sm:flex-row">
            <Link href="/o-que-fazemos">
              <Button size="lg" className="h-12 px-6 text-base shadow-lg shadow-fuchsia-500/20">
                {t("ctaPrimary")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/casos">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-6 text-base border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                {t("ctaSecondary")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Stage Column */}
        <div className="relative">
          <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/10 via-white/5 to-transparent blur-3xl" />
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/30">
            <div className="absolute inset-0">
              <motion.div
                className="absolute -left-10 top-4 h-24 w-24 rounded-full bg-fuchsia-500/20 blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 8, repeat: Infinity }}
              />
              <motion.div
                className="absolute -right-10 bottom-6 h-28 w-28 rounded-full bg-blue-500/20 blur-3xl"
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 10, repeat: Infinity }}
              />
            </div>

            <div className="relative grid gap-4 p-6 lg:grid-cols-2">
              <div className="lg:col-span-2 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80">
                <div className="flex items-center gap-3">
                  <MonitorSmartphone className="h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                      {t("stage.subtitle")}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {t(`capabilities.${active}.title`)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <div className="h-2 w-12 rounded-full bg-gradient-to-r from-fuchsia-400 via-blue-400 to-emerald-300" />
                  {t(`capabilities.${active}.metric`)}
                </div>
              </div>

              {capabilities.map((cap) => (
                <CapabilityCard
                  key={cap.id}
                  capability={cap}
                  t={t}
                  active={active === cap.id}
                  onHover={() => setActive(cap.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
