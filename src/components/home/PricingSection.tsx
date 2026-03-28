"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, Shield, Star, DollarSign, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionDivider } from "@/components/ui/section-divider";
import { useLocale, useTranslations } from "next-intl";
import {
  getSubscriptionMarketingFacts,
  getSubscriptionMarketingPlans,
} from "@/lib/subscription-marketing";

export function PricingSection() {
  const t = useTranslations("Home.Pricing");
  const locale = useLocale();
  const plans = getSubscriptionMarketingPlans(locale);
  const facts = getSubscriptionMarketingFacts(locale);
  const isPtBr = locale === "pt-BR" || locale === "pt";

  return (
    <section className="relative bg-gradient-to-b from-background to-muted/30 py-20">
      <SectionDivider icon={DollarSign} />
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            {t("title")}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t("description")}
          </p>
        </motion.div>

        <div className="mx-auto mb-10 grid max-w-6xl gap-4 md:grid-cols-2 xl:grid-cols-4">
          {facts.map((fact, i) => (
            <motion.div
              key={fact.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-border/60 bg-card/60 p-5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  {fact.title}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {fact.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.slug}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={{ scale: plan.highlighted ? 1.08 : 1.05, y: -12 }}
              transition={{
                delay: i * 0.1,
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              viewport={{ once: true }}
              className={`relative ${plan.highlighted ? "md:-mt-4" : ""}`}
            >
              <div
                className={`absolute inset-0 rounded-lg blur-2xl opacity-0 transition-all duration-500 group-hover:opacity-70 ${
                  i === 0 ? "bg-blue-500/40" : i === 1 ? "bg-amber-500/50" : "bg-orange-500/40"
                }`}
                style={{ transform: "translateY(10px)" }}
              />
              <Card
                className={`${
                  plan.highlighted ? "border-primary bg-primary/10 shadow-2xl" : "border-border bg-card/50"
                } group relative flex h-full flex-col p-8 backdrop-blur transition-all duration-500 hover:border-primary`}
                style={{
                  boxShadow: plan.highlighted
                    ? "0 25px 50px -12px rgba(var(--primary-rgb), 0.4), 0 0 0 1px rgba(var(--primary-rgb), 0.1)"
                    : i === 0
                      ? "0 10px 40px -10px rgba(59, 130, 246, 0.2)"
                      : "0 10px 40px -10px rgba(251, 146, 60, 0.2)",
                }}
              >
                <div
                  className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: plan.highlighted
                      ? "linear-gradient(90deg, rgba(var(--primary-rgb), 0.5), rgba(var(--primary-rgb), 0) 50%, rgba(var(--primary-rgb), 0.5))"
                      : "linear-gradient(90deg, rgba(var(--primary-rgb), 0.3), rgba(var(--primary-rgb), 0) 50%, rgba(var(--primary-rgb), 0.3))",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 3s linear infinite",
                  }}
                />
                {plan.badge && (
                  <motion.div
                    animate={{
                      scale: [1, 1.15, 1],
                      rotate: [0, -3, 3, 0],
                      y: [0, -2, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-2 border-background bg-gradient-to-r from-primary to-accent px-4 text-primary-foreground shadow-2xl shadow-primary/50">
                      <Sparkles className="mr-1 inline h-3 w-3" />
                      {plan.badge}
                      <Sparkles className="ml-1 inline h-3 w-3" />
                    </Badge>
                  </motion.div>
                )}

                <div>
                  <h3 className="mb-2 text-2xl font-bold text-foreground">{plan.displayName}</h3>
                  <p className="mb-6 text-muted-foreground">{plan.description}</p>

                  <div className="mb-6">
                    <motion.span
                      className="bg-gradient-to-r from-primary to-accent bg-clip-text text-5xl font-bold text-transparent"
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                    >
                      {plan.priceLabel}
                    </motion.span>
                    <span className="text-muted-foreground">{plan.periodLabel}</span>
                  </div>

                  <ul className="mb-8 space-y-3">
                    {plan.featureHighlights.map((feature, j) => (
                      <motion.li
                        key={j}
                        className="flex items-start gap-2"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 + j * 0.05 }}
                      >
                        <CheckCircle2 className="mt-1 shrink-0 text-primary" size={20} />
                        <span className="text-foreground/90">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <Link href={plan.href} className="mt-auto">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      className={`w-full ${
                        plan.highlighted
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
                          : "border-primary/50 hover:bg-primary/10"
                      }`}
                      variant={plan.highlighted ? "default" : "outline"}
                      size="lg"
                    >
                      {isPtBr ? `Assinar ${plan.displayName}` : `Choose ${plan.displayName}`}
                    </Button>
                  </motion.div>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="mb-4 flex items-center justify-center gap-8">
            <motion.div
              className="flex items-center gap-2 text-muted-foreground"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring" }}
            >
              <Shield className="h-5 w-5 text-primary" />
              <span>{t("guarantee")}</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-2 text-muted-foreground"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring" }}
            >
              <Star className="h-5 w-5 fill-primary text-primary" />
              <span>{t("rating")}</span>
            </motion.div>
          </div>
          <p className="text-sm text-muted-foreground/70">
            {isPtBr
              ? "Curso gratis do mes, rotacao mensal e certificacao usam a mesma regra mostrada nestes planos."
              : "The free course of the month, monthly rotation, and certification follow the same rules shown in these plans."}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
